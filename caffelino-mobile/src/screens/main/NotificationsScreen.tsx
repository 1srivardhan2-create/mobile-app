import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, NotificationModel } from '../../api/notifications.api';
import { OrderBillCard } from '../../components/meetup/order/OrderBillCard';
import { spacing, typography, radius, shadows } from '../../theme';

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { palette } = useTheme();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await notificationsApi.getUserNotifications(user.id);
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const renderTicket = (ticket: any, dateStr: string) => {
    if (!ticket) return null;
    return (
      <View style={[styles.ticketContainer, { backgroundColor: '#FFF' }]}>
        <View style={[styles.ticketHeader, { backgroundColor: palette.coffeeBrown }]}>
          <Text style={styles.ticketTitle}>{ticket.eventName || 'Event Ticket'}</Text>
          <Text style={styles.ticketBadge}>PAID</Text>
        </View>
        <View style={styles.ticketBody}>
          <Text style={{ ...typography.body, color: palette.espresso, fontWeight: '700', marginBottom: 4 }}>
            Ticket Number: {ticket.ticketNumber}
          </Text>
          <Text style={{ ...typography.bodySmall, color: palette.textSecondary, marginBottom: 12 }}>
            {ticket.date ? new Date(ticket.date).toLocaleDateString() : dateStr} • {ticket.time || ''}
          </Text>
          {ticket.qrCodeUrl && (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Image source={{ uri: ticket.qrCodeUrl }} style={{ width: 120, height: 120 }} />
              <Text style={{ fontSize: 10, color: palette.textMuted, marginTop: 4 }}>Scan at entry</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: NotificationModel }) => {
    const isBill = item.type === 'BILL';
    const isTicket = item.type === 'TICKET';
    const dateStr = new Date(item.createdAt).toLocaleDateString();

    return (
      <View style={styles.notificationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons 
              name={isTicket ? "ticket" : "restaurant"} 
              size={20} 
              color={isTicket ? palette.goldAccent : palette.coffeeBrown} 
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[styles.message, { color: palette.espresso }]}>{item.message}</Text>
            <Text style={[styles.date, { color: palette.textMuted }]}>{dateStr}</Text>
          </View>
        </View>

        {isBill && item.metadata?.billData && (
          <View style={styles.billWrapper}>
            <OrderBillCard billData={item.metadata.billData} />
          </View>
        )}

        {isTicket && item.metadata?.ticketDetails && (
          <View style={styles.ticketWrapper}>
            {renderTicket(item.metadata.ticketDetails, dateStr)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.espresso} />
        </Pressable>
        <Text style={[styles.title, { color: palette.espresso }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.coffeeBrown} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color={palette.border} />
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.coffeeBrown} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  notificationCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    ...typography.bodySmall,
  },
  billWrapper: {
    marginTop: spacing.sm,
    // Add negative margin if the card is too wide by default
    marginHorizontal: -spacing.sm,
  },
  ticketWrapper: {
    marginTop: spacing.sm,
  },
  ticketContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  ticketTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  ticketBadge: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ticketBody: {
    padding: spacing.md,
  },
});
