import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Pressable, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing, typography } from '../../theme';
import { API_BASE_URL } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { EventRegistration } from '../../types';

export function MyTicketsScreen() {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [tickets, setTickets] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/events/my-tickets/${user.id}`);
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const generateTicketHTML = (item: any, event: any) => `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 20px; color: #3E2723; }
          .ticket { background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; border: 1px solid #E0E0E0; }
          .banner { width: 100%; height: 200px; object-fit: cover; }
          .content { padding: 24px; position: relative; }
          .status { position: absolute; top: 24px; right: 24px; background: #E8F5E9; color: #2E7D32; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          h1 { margin: 0 0 16px 0; font-size: 28px; line-height: 1.2; padding-right: 80px; }
          .details { margin-bottom: 24px; }
          .detail-row { display: flex; align-items: center; margin-bottom: 8px; font-size: 16px; color: #757575; }
          .detail-row strong { color: #3E2723; margin-right: 8px; }
          .divider { border-top: 2px dashed #E0E0E0; margin: 0; }
          .qr-section { padding: 32px 24px; text-align: center; background-color: #F9F9F9; }
          .qr-code { width: 200px; height: 200px; margin-bottom: 16px; }
          .ticket-number { font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0 0 8px 0; }
          .footer-note { font-size: 14px; color: #757575; margin: 0; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <img src="${event.bannerUrl}" class="banner" />
          <div class="content">
            <div class="status">${item.status.toUpperCase()}</div>
            <h1>${event.eventName}</h1>
            <div class="details">
              <div class="detail-row"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div class="detail-row"><strong>Time:</strong> ${event.startTime} - ${event.endTime}</div>
              <div class="detail-row"><strong>Venue:</strong> ${event.venueName}, ${event.city}</div>
              <div class="detail-row"><strong>Name:</strong> ${item.userName || 'N/A'}</div>
              <div class="detail-row"><strong>Mobile:</strong> ${item.mobileNumber || 'N/A'}</div>
              <div class="detail-row"><strong>Email:</strong> ${item.email || 'N/A'}</div>
              <div class="detail-row"><strong>Type:</strong> ${item.ticketType || 'EVENT'} TICKET</div>
              <div class="detail-row"><strong>Registered On:</strong> ${new Date(item.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="qr-section">
            <h2 class="ticket-number">${item.ticketNumber}</h2>
            ${item.qrCodeUrl ? `<img src="${item.qrCodeUrl}" class="qr-code" />` : `<div style="padding:40px; background:#eee;">No QR Code</div>`}
            <p class="footer-note">Please present this QR code at the entrance.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const handleDownloadPDF = async (item: any, event: any) => {
    try {
      const html = generateTicketHTML(item, event);
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        // Share directly on Android to let user save it
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Could not generate PDF. Please try again.');
    }
  };

  const handleShareTicket = async (item: any, event: any) => {
    try {
      const html = generateTicketHTML(item, event);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { 
        dialogTitle: `Share your ticket for ${event.eventName}`,
        mimeType: 'application/pdf'
      });
    } catch (err) {
      console.error('Failed to share ticket:', err);
    }
  };

  const renderTicket = ({ item }: { item: any }) => {
    const event = item.eventId; 
    if (!event) return null;

    return (
      <View style={[styles.ticketCard, shadows.card, { backgroundColor: '#FFF' }]}>
        {/* Ticket Header Image */}
        <Image source={{ uri: event.bannerUrl }} style={styles.banner} />
        
        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          
          <Text style={[styles.eventName, { color: palette.espresso }]}>{event.eventName}</Text>
          
          <View style={styles.detailsRow}>
            <Ionicons name="calendar-outline" size={16} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]}>
              {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.startTime}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={16} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]} numberOfLines={1}>
              {event.venueName}, {event.city}
            </Text>
          </View>

          {/* Attendee Details */}
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: palette.border }}>
            <View style={styles.detailsRow}>
              <Ionicons name="person-outline" size={16} color={palette.textSecondary} />
              <Text style={[styles.detailText, { color: palette.espresso, fontWeight: '600' }]} numberOfLines={1}>
                {item.userName || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="call-outline" size={16} color={palette.textSecondary} />
              <Text style={[styles.detailText, { color: palette.textSecondary }]} numberOfLines={1}>
                {item.mobileNumber || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="mail-outline" size={16} color={palette.textSecondary} />
              <Text style={[styles.detailText, { color: palette.textSecondary }]} numberOfLines={1}>
                {item.email || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={[styles.notchLeft, { backgroundColor: palette.cream }]} />
          <View style={[styles.dashLine, { borderColor: palette.border }]} />
          <View style={[styles.notchRight, { backgroundColor: palette.cream }]} />
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={[styles.ticketNumber, { color: palette.espresso }]}>{item.ticketNumber}</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 12, marginBottom: spacing.md }}>
            Scan at entry
          </Text>
          
          {item.qrCodeUrl ? (
            <Image source={{ uri: item.qrCodeUrl }} style={styles.qrCode} />
          ) : (
            <View style={styles.qrFallback}>
              <Text>No QR Available</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable 
              style={[styles.actionBtn, { borderColor: palette.border, borderWidth: 1 }]} 
              onPress={() => handleDownloadPDF(item, event)}
            >
              <Ionicons name="download-outline" size={18} color={palette.espresso} />
              <Text style={[styles.actionBtnText, { color: palette.espresso }]}>Download</Text>
            </Pressable>

            <Pressable 
              style={[styles.actionBtn, { backgroundColor: palette.coffeeBrown }]} 
              onPress={() => handleShareTicket(item, event)}
            >
              <Ionicons name="share-social-outline" size={18} color="#FFF" />
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: palette.cream }]}>
        <ActivityIndicator size="large" color={palette.goldAccent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.espresso} />
        </Pressable>
        <Text style={[styles.title, { color: palette.espresso }]}>My Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item._id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.coffeeBrown} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color={palette.border} />
            <Text style={[styles.emptyTitle, { color: palette.espresso }]}>No Tickets Yet</Text>
            <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
              Register for an event to see your tickets here.
            </Text>
            <Pressable
              style={[styles.exploreBtn, { backgroundColor: palette.coffeeBrown }]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Events' })}
            >
              <Text style={styles.exploreBtnText}>Explore Events</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...typography.h2 },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  ticketCard: {
    borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  banner: { width: '100%', height: 140, resizeMode: 'cover' },
  ticketInfo: { padding: spacing.lg, position: 'relative' },
  statusBadge: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  statusText: { color: '#2E7D32', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  eventName: { ...typography.h2, marginBottom: spacing.md, paddingRight: 60, fontSize: 20 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 8 },
  detailText: { fontSize: 14, flex: 1 },
  
  divider: { height: 24, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  notchLeft: {
    width: 24, height: 24, borderRadius: 12,
    position: 'absolute', left: -12, zIndex: 1,
  },
  dashLine: {
    flex: 1, borderWidth: 1, borderStyle: 'dashed', marginHorizontal: 20,
  },
  notchRight: {
    width: 24, height: 24, borderRadius: 12,
    position: 'absolute', right: -12, zIndex: 1,
  },
  
  qrSection: { padding: spacing.lg, paddingTop: spacing.md, alignItems: 'center' },
  ticketNumber: { fontSize: 18, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  qrCode: { width: 160, height: 160, marginBottom: spacing.lg },
  qrFallback: { width: 160, height: 160, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  
  actionRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  actionBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 8, paddingVertical: 12, borderRadius: radius.full 
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { ...typography.h2, marginTop: spacing.md },
  emptySubtitle: { ...typography.body, marginTop: spacing.xs, marginBottom: spacing.xl },
  exploreBtn: { paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.full },
  exploreBtnText: { color: '#FFF', fontWeight: '600' },
});
