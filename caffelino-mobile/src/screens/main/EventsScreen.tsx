import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';

import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing, typography } from '../../theme';
import { API_BASE_URL } from '../../config/env';
import { Event } from '../../types';

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const featuredEvents = events.slice(0, 2); // First 2
  const upcomingEvents = events; // Show all events in Upcoming
  const freeEvents = events.filter(e => e.ticketPrice === 0);
  const paidEvents = events.filter(e => e.ticketPrice > 0);

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()} style={[styles.card, shadows.card]}>
      <Pressable onPress={() => navigation.navigate('EventDetails', { eventId: item._id })}>
        <Image source={{ uri: item.bannerUrl }} style={styles.banner} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bannerGradient}>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{item.ticketPrice === 0 ? 'FREE' : 'PAID'}</Text>
          </View>
        </LinearGradient>
        <View style={[styles.cardContent, { backgroundColor: palette.white }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.category, { color: palette.goldAccent }]}>{item.category?.toUpperCase() || 'EVENT'}</Text>
          </View>
          <Text style={[styles.eventName, { color: palette.espresso }]} numberOfLines={1}>{item.eventName}</Text>
          <Text style={{ color: palette.textSecondary, fontSize: 13, marginBottom: 8 }}>
            Hosted By <Text style={{ fontWeight: 'bold' }}>{item.organizationName || item.companyName || 'Caffelino Events'}</Text>
          </Text>
          
          <View style={styles.detailsRow}>
            <Ionicons name="calendar-outline" size={14} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]}>{item.date} • {item.startTime}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={14} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]} numberOfLines={1}>
              {item.cafeName}, {item.city}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  const renderSection = (title: string, data: Event[]) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.espresso }]}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={renderEventCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          snapToInterval={280 + spacing.md}
          decelerationRate="fast"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: palette.cream }]}>
        <ActivityIndicator size="large" color={palette.coffeeBrown} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <View>
          <Animated.Text entering={FadeIn.duration(400)} style={[styles.header, { color: palette.espresso }]}>
            Events
          </Animated.Text>
          <Text style={[styles.subheader, { color: palette.textSecondary }]}>
            Discover coffee workshops & meetups
          </Text>
        </View>
        <Pressable 
          style={[styles.myTicketsBtn, { backgroundColor: palette.coffeeBrown }]}
          onPress={() => navigation.navigate('MyTickets')}
        >
          <Ionicons name="ticket" size={20} color="#FFF" />
        </Pressable>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.coffeeBrown} />}
        ListEmptyComponent={
          <>
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar" size={64} color={palette.border} />
                <Text style={[styles.emptyTitle, { color: palette.espresso }]}>No Events Yet</Text>
                <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
                  Stay tuned for upcoming coffee events!
                </Text>
              </View>
            ) : (
              <View style={styles.content}>
                {renderSection('Featured Events', featuredEvents)}
                {renderSection('Free Events', freeEvents)}
                {renderSection('Paid Events', paidEvents)}
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    ...typography.h1,
  },
  subheader: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  myTicketsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 280,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  banner: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  priceTag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  priceText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seats: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventName: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
});
