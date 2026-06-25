import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import axios from 'axios';
import { paymentService, type OwnerOrder } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config/env';
import { typography, spacing, radius, shadows } from '../../theme';

type EventRegistration = {
  _id: string;
  ticketNumber: string;
  userName: string;
  email: string;
  mobileNumber: string;
  eventName: string;
  registrationDate: string;
  checkedIn: boolean;
  eventId?: { eventName: string };
};

export function OwnerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout, refreshUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'events'>('orders');
  
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await paymentService.getOwnerOrders();
      setOrders(data);
    } catch (e) { console.log(e); }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      if (!user) return;
      const res = await axios.get(`${API_BASE_URL}/api/events/organizer-registrations/${user.id}`);
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (e) { console.log(e); }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'orders') {
      await fetchOrders();
    } else {
      await fetchRegistrations();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    else fetchRegistrations();
  }, [fetchOrders, fetchRegistrations, activeTab]);

  const updateStatus = async (orderId: string, status: OwnerOrder['status']) => {
    await paymentService.updateOwnerOrderStatus(orderId, status);
    fetchOrders();
  };

  const activeOrders = orders.filter((o) => o.status !== 'Served');
  const pastOrders = orders.filter((o) => o.status === 'Served');
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>Manage your venues and events</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable 
            onPress={async () => {
              if (user) await refreshUser({ ...user, role: 'user' });
            }} 
            style={[styles.logoutBtn, { marginRight: 8, backgroundColor: '#f0f0f0', borderRadius: 8 }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>Exit Dev Mode</Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#4A3B32" />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Cafe Orders</Text>
        </Pressable>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'events' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>Event Registrations</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'orders' ? (
          <>
            <View style={styles.statsRow}>
              <StatCard title="Today's Orders" value={orders.length.toString()} icon="receipt-outline" />
              <StatCard title="Revenue" value={`₹${totalRevenue.toFixed(0)}`} icon="wallet-outline" />
            </View>

            <Text style={styles.sectionTitle}>Active Orders</Text>

            {activeOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No active orders right now.</Text>
              </View>
            ) : (
              activeOrders.map((order, i) => (
                <OrderCard key={order.orderId} order={order} index={i} onUpdateStatus={updateStatus} />
              ))
            )}

            {pastOrders.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Past Orders</Text>
                {pastOrders.map((order, i) => (
                  <OrderCard key={order.orderId} order={order} index={i} onUpdateStatus={updateStatus} />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard title="Total Registrations" value={registrations.length.toString()} icon="ticket-outline" />
              <StatCard title="Checked In" value={registrations.filter(r => r.checkedIn).length.toString()} icon="checkmark-done-outline" />
            </View>

            <Text style={styles.sectionTitle}>All Registrations</Text>

            {registrations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="ticket-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No event registrations yet.</Text>
              </View>
            ) : (
              registrations.map((reg, i) => (
                <RegistrationCard key={reg._id} reg={reg} index={i} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {activeTab === 'events' && (
        <Pressable 
          style={[styles.fab, shadows.card, { bottom: insets.bottom + spacing.lg }]} 
          onPress={() => navigation.navigate('AttendanceScanner')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#FFF" />
          <Text style={styles.fabText}>Scanner</Text>
        </Pressable>
      )}
    </View>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: any }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={24} color="#C8A97E" />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );
}

function OrderCard({
  order,
  index,
  onUpdateStatus,
}: {
  order: OwnerOrder;
  index: number;
  onUpdateStatus: (id: string, s: OwnerOrder['status']) => void;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{order.orderId}</Text>
            <Text style={styles.timeLabel}>
              {order.meetupDate} • {order.meetupTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <DetailItem label="Host" value={order.hostName} icon="person" />
          <DetailItem label="Code" value={order.meetupCode} icon="keypad" />
          <DetailItem label="Members" value={order.memberCount.toString()} icon="people" />
          <DetailItem label="Total" value={`₹${order.totalAmount.toFixed(2)}`} icon="cash" />
        </View>

        <View style={styles.divider} />

        <Text style={styles.itemsTitle}>Ordered Items</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        {order.couponApplied && (
          <View style={styles.couponRow}>
            <Text style={styles.couponText}>Coupon Applied: {order.couponApplied}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {order.status === 'New' && (
            <ActionButton
              label="Accept & Prepare"
              color="#2E7D32"
              onPress={() => onUpdateStatus(order.orderId, 'Preparing')}
            />
          )}
          {order.status === 'Preparing' && (
            <ActionButton
              label="Mark Ready"
              color="#F57C00"
              onPress={() => onUpdateStatus(order.orderId, 'Ready')}
            />
          )}
          {order.status === 'Ready' && (
            <ActionButton
              label="Mark Served"
              color="#1976D2"
              onPress={() => onUpdateStatus(order.orderId, 'Served')}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={14} color="#666" style={{ marginRight: 6 }} />
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'New':
      return '#E53935';
    case 'Preparing':
      return '#F57C00';
    case 'Ready':
      return '#43A047';
    case 'Served':
      return '#757575';
    default:
      return '#666';
  }
}

function RegistrationCard({ reg, index }: { reg: EventRegistration; index: number }) {
  const eventName = reg.eventName || reg.eventId?.eventName || 'Unknown Event';
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>{reg.ticketNumber}</Text>
            <Text style={styles.timeLabel}>
              {new Date(reg.registrationDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: reg.checkedIn ? '#43A047' : '#F57C00' }]}>
            <Text style={styles.statusText}>{reg.checkedIn ? 'Checked In' : 'Pending'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <DetailItem label="Event" value={eventName} icon="calendar" />
          <DetailItem label="Name" value={reg.userName} icon="person" />
          <DetailItem label="Email" value={reg.email || 'N/A'} icon="mail" />
          <DetailItem label="Phone" value={reg.mobileNumber || 'N/A'} icon="call" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { ...typography.h2, color: '#4A3B32' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  logoutBtn: { padding: 8 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 169, 126, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#4A3B32' },
  statTitle: { fontSize: 12, color: '#666', fontWeight: '500' },
  sectionTitle: { ...typography.h3, color: '#4A3B32', marginBottom: spacing.md },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: { marginTop: 12, fontSize: 15, color: '#666', fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  orderId: { fontSize: 16, fontWeight: '800', color: '#333' },
  timeLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { width: '45%', flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: spacing.md },
  itemsTitle: { fontSize: 14, fontWeight: '700', color: '#4A3B32', marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemQty: { width: 30, fontSize: 14, fontWeight: '600', color: '#C8A97E' },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  couponRow: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: '#f0fdf4', borderRadius: 8 },
  couponText: { color: '#166534', fontSize: 12, fontWeight: '600' },
  actions: { marginTop: spacing.lg, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tabContainer: {
    flexDirection: 'row', backgroundColor: '#fff', 
    borderBottomWidth: 1, borderBottomColor: '#eee',
    paddingHorizontal: spacing.lg
  },
  tabBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent'
  },
  tabBtnActive: { borderBottomColor: '#C8A97E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#C8A97E', fontWeight: '800' },

  fab: {
    position: 'absolute', right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3E2723', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: radius.full
  },
  fabText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});
