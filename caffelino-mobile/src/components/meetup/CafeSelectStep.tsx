import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { FavoriteHeart } from '../favorites/FavoriteHeart';
import { useTheme } from '../../context/ThemeContext';
import { sortByDistance } from '../../hooks/useCafes';
import { getCafeCover } from '../../utils/cafeImages';
import { radius, shadows, spacing } from '../../theme';
import type { Cafe } from '../../types';
import { CoffeeLoader } from '../ui/CoffeeLoader';

const FILTERS = [
  'Nearby',
  'Popular',
  'Study Friendly',
  'Quiet',
  'Trending',
  'Open Now',
  'Date Friendly',
  'Networking',
] as const;

type Filter = (typeof FILTERS)[number];

function cafeHash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return h;
}

function cafeMeta(cafe: Cafe) {
  const h = cafeHash(cafe._id);
  return {
    rating: cafe.rating ?? 4.1 + (h % 9) / 10,
    studyFriendly: h % 3 === 0,
    quiet: h % 4 === 0,
    trending: h % 2 === 0,
    open: h % 5 !== 0,
    dateFriendly: h % 5 === 1,
    networking: h % 5 === 2,
  };
}

function shortAddress(address?: string): string {
  if (!address) return 'Hyderabad';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(', ');
  return parts[0] ?? address;
}

// Removed SkeletonCard

function MeetupCafeCard({
  cafe,
  index,
  selected,
  onPress,
}: {
  cafe: Cafe;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const meta = cafeMeta(cafe);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const imageUri = getCafeCover(cafe);
  const rating = typeof meta.rating === 'number' ? meta.rating.toFixed(1) : meta.rating;

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(400).springify()}>
      <Animated.View style={anim}>
        <Pressable
          onPress={() => {
            scale.value = withSpring(0.98, { damping: 12 });
            setTimeout(() => {
              scale.value = withSpring(1, { damping: 14 });
            }, 120);
            onPress();
          }}
          style={({ pressed }) => [
            styles.cafeCard,
            shadows.card,
            {
              backgroundColor: palette.white,
              borderColor: selected ? palette.coffeeBrown : palette.glassBorder,
              borderWidth: selected ? 2.5 : 1,
              opacity: pressed ? 0.97 : 1,
            },
          ]}
        >
          <View style={styles.imageWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.cafeImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cafeImage, { backgroundColor: palette.latteBrown }]}>
                <Text style={{ fontSize: 48 }}>☕</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(43,27,23,0.35)']}
              style={styles.imageOverlay}
            />
            <FavoriteHeart cafeId={cafe._id} cafe={cafe} style={styles.heart} />
          </View>

          <View style={[styles.cafeBody, { backgroundColor: palette.white }]}>
            <Text style={[styles.cafeName, { color: palette.espresso }]} numberOfLines={2}>
              {cafe.Name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={{ color: palette.goldAccent, fontWeight: '700' }}>⭐ {rating}</Text>
            </View>
            <Text style={[styles.address, { color: palette.textMuted }]} numberOfLines={1}>
              📍 {shortAddress(cafe.Cafe_Address)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

interface CafeSelectStepProps {
  cafes: Cafe[];
  loading: boolean;
  selectedCafe: Cafe | null;
  onSelect: (cafe: Cafe) => void;
  onContinue: () => void;
  creating: boolean;
}

export function CafeSelectStep({
  cafes,
  loading,
  selectedCafe,
  onSelect,
  onContinue,
  creating,
}: CafeSelectStepProps) {
  const { palette } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Nearby');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch {
        /* location optional */
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    let list = coords ? sortByDistance(cafes, coords.lat, coords.lng) : [...cafes];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.Name.toLowerCase().includes(q) ||
          c.Cafe_Address?.toLowerCase().includes(q),
      );
    }
    if (filter === 'Open Now') list = list.filter((c) => cafeMeta(c).open);
    if (filter === 'Study Friendly') list = list.filter((c) => cafeMeta(c).studyFriendly);
    if (filter === 'Quiet') list = list.filter((c) => cafeMeta(c).quiet);
    if (filter === 'Trending') list = list.filter((c) => cafeMeta(c).trending);
    if (filter === 'Date Friendly') list = list.filter((c) => cafeMeta(c).dateFriendly);
    if (filter === 'Networking') list = list.filter((c) => cafeMeta(c).networking);
    if (filter === 'Popular') {
      list = [...list].sort((a, b) => cafeHash(b._id) - cafeHash(a._id));
    }
    return list;
  }, [cafes, coords, search, filter]);

  const canCreate = Boolean(selectedCafe) && !creating;

  return (
    <View style={styles.wrap}>
      <View style={styles.searchSection}>
        <View style={[styles.searchWrap, shadows.soft, { backgroundColor: palette.white }]}>
          <Ionicons name="search" size={20} color={palette.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: palette.espresso }]}
            placeholder="Search Café..."
            placeholderTextColor={palette.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
        decelerationRate="fast"
        snapToAlignment="start"
        keyboardShouldPersistTaps="handled"
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterPill,
                shadows.soft,
                {
                  backgroundColor: active ? palette.coffeeBrown : palette.white,
                  borderColor: active ? palette.coffeeBrown : palette.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#FFF' : palette.espresso,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.listScroll}
      >
        {loading ? (
          <CoffeeLoader mini message="Finding the best cafes near you" />
        ) : (
          sorted.map((cafe, i) => (
            <MeetupCafeCard
              key={cafe._id}
              cafe={cafe}
              index={i}
              selected={selectedCafe?._id === cafe._id}
              onPress={() => onSelect(cafe)}
            />
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: palette.warmCream, borderTopColor: palette.border }]}>
        <Pressable
          disabled={!canCreate}
          onPress={onContinue}
          style={[
            styles.createBtn,
            {
              backgroundColor: canCreate ? palette.coffeeBrown : '#BDBDBD',
            },
          ]}
        >
          <Text style={[styles.createBtnText, { opacity: canCreate ? 1 : 0.85 }]}>
            {creating ? 'Creating…' : '☕ Create Meetup'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16 },
  filtersScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  filtersContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  listScroll: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  skeleton: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: '#E8E0D8',
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  cafeCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  imageWrap: { position: 'relative' },
  cafeImage: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  heart: { position: 'absolute', top: 12, right: 12 },
  cafeBody: { padding: spacing.md },
  cafeName: { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  address: { fontSize: 14, marginTop: 6, fontWeight: '500' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  createBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  createBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
