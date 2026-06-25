import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { cafesApi } from '../../api/cafes.api';
import { FavoriteHeart } from '../../components/favorites/FavoriteHeart';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { useTheme } from '../../context/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCafes } from '../../hooks/useCafes';
import type { Cafe, MainStackParamList, MenuItem } from '../../types';
import { getCafeImages } from '../../utils/cafeImages';
import { buildGoogleMapsCafeUrl } from '../../utils/mapsSearch';
import { radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'CafeDetails'>;
type TabKey = 'menu' | 'photos';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 280;

const MENU_CATEGORY_ORDER = [
  'Beverages',
  'Coffee',
  'Tea',
  'Desserts',
  'Snacks',
  'Pizza',
  'Pasta',
  'Sandwiches',
  'Burgers',
  'Breakfast',
  'Mocktails',
  'Specials',
];

export function CafeDetailsScreen({ route, navigation }: Props) {
  const { cafeId, initialCafe } = route.params;
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { registerCafes } = useFavorites();
  const { cafes, loading: cafesLoading } = useCafes();
  const [cafe, setCafe] = useState<Cafe | null>(() => initialCafe || cafes.find(c => c._id === cafeId) || null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('menu');
  const [slideIndex, setSlideIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (cafe) return; // Already have it, don't re-fetch

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await cafesApi.getById(cafeId);
        if (!cancelled) setCafe(res.cafe);
      } catch {
        // Fallback handled by the next effect
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cafeId, cafe]);

  useEffect(() => {
    if (!cafe) {
      const cached = cafes.find((c) => c._id === cafeId);
      if (cached) setCafe(cached);
    }
  }, [cafeId, cafes, cafe]);

  useEffect(() => {
    if (cafe) registerCafes([cafe]);
  }, [cafe, registerCafes]);

  const images = useMemo(() => (cafe ? getCafeImages(cafe) : []), [cafe]);
  const menuItems = cafe?.menuItems ?? [];
  const menuCount = menuItems.length;

  const menuByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const cat = item.Category?.trim() || 'Specials';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    const ordered: { category: string; items: MenuItem[] }[] = [];
    for (const cat of MENU_CATEGORY_ORDER) {
      if (map.has(cat)) ordered.push({ category: cat, items: map.get(cat)! });
      map.delete(cat);
    }
    for (const [category, items] of map) {
      ordered.push({ category, items });
    }
    return ordered;
  }, [menuItems]);

  const phone = cafe?.phone ?? cafe?.Phonenumber;
  const cost = cafe?.costForOne ?? cafe?.Average_Cost;
  const rating = cafe?.rating ?? 4.5;
  const isOpen = cafe?.openNow !== false;

  const openDirections = useCallback(() => {
    if (!cafe) return;
    const url = buildGoogleMapsCafeUrl(cafe);
    if (url) Linking.openURL(url);
  }, [cafe]);

  const callCafe = () => {
    if (phone) Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const shareCafe = async () => {
    const url = `https://caffelino.in/cafe/${cafeId}`;
    await Share.share({
      message: `Check out ${cafe?.Name} on Caffélino!\n${url}`,
      url,
      title: cafe?.Name,
    });
  };

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setSlideIndex(idx);
  };

  if (!cafe && loading) return <CoffeeLoader message="Brewing your coffee experience..." mini />;
  if (!cafe && !loading && !cafesLoading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.cream }]}>
        <Text style={{ color: palette.textMuted }}>Café not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }}>
          <Text style={{ color: palette.coffeeBrown, fontWeight: '600' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.warmCream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={styles.heroWrap}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onHeroScroll}
              scrollEventThrottle={16}
              keyExtractor={(uri, i) => `${uri}-${i}`}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => { setGalleryIndex(index); setGalleryOpen(true); }}>
                  <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
                </Pressable>
              )}
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: palette.latteBrown, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 64 }}>☕</Text>
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {slideIndex + 1} / {images.length}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.back, { top: insets.top + 8 }]}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <FavoriteHeart cafeId={cafe._id} cafe={cafe} style={[styles.heroHeart, { top: insets.top + 8 }]} />
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.shopIcon}>🏪</Text>
            <Text style={[styles.name, { color: palette.espresso }]}>{cafe.Name}</Text>
          </View>
          <Text style={[styles.category, { color: palette.textMuted }]}>
            {cafe.establishmentType || 'Cafe'}
          </Text>

          {cafe.Cafe_Address ? (
            <InfoLine icon="location-outline" text={cafe.Cafe_Address} palette={palette} />
          ) : null}
          {cost != null && (
            <InfoLine icon="cash-outline" text={`₹${cost} for one`} palette={palette} />
          )}
          {cafe.managerName ? (
            <InfoLine
              icon="cafe-outline"
              text={`Managed by ${cafe.managerName}`}
              palette={palette}
            />
          ) : null}
          {phone ? <InfoLine icon="call-outline" text={phone} palette={palette} /> : null}

          {cafe.AboutCafe ? (
            <Text style={[styles.tagline, { color: palette.textSecondary }]}>
              "{cafe.AboutCafe}"
            </Text>
          ) : null}

          <View style={styles.badges}>
            <Badge label={cafe.establishmentType || 'Cafe'} palette={palette} />
            {cafe.verified !== false && <Badge label="Verified Partner" palette={palette} />}
            <Badge
              label={isOpen ? 'Open Now' : 'Closed'}
              palette={palette}
              accent={isOpen ? palette.forestGreen : palette.error}
            />
          </View>

          <View style={styles.actions}>
            <ActionChip icon="call" label="Call" onPress={callCafe} palette={palette} />
            <ActionChip icon="share-social" label="Share" onPress={shareCafe} palette={palette} />
            <View style={styles.saveChip}>
              <Text style={{ color: palette.textSecondary, fontSize: 12, marginBottom: 4 }}>Save</Text>
              <FavoriteHeart cafeId={cafe._id} cafe={cafe} size={26} />
            </View>
          </View>
        </View>

        <View style={[styles.tabs, { borderColor: palette.border }]}>
          <TabButton
            active={tab === 'photos'}
            label={`📸 Photos (${images.length})`}
            onPress={() => setTab('photos')}
            palette={palette}
          />
          <TabButton
            active={tab === 'menu'}
            label={`🍽️ Menu (${menuCount})`}
            onPress={() => setTab('menu')}
            palette={palette}
          />
        </View>

        {tab === 'photos' ? (
          <View style={styles.photosSection}>
            <Text style={[styles.sectionHeading, { color: palette.espresso }]}>Cafe Photos</Text>
            <View style={styles.photoGrid}>
              {images.map((uri, i) => (
                <Pressable
                  key={`${uri}-${i}`}
                  style={styles.photoCell}
                  onPress={() => { setGalleryIndex(i); setGalleryOpen(true); }}
                >
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <View style={styles.photoBadge}>
                    <Text style={styles.photoBadgeText}>
                      {i + 1} / {images.length}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
            {!images.length && (
              <Text style={{ color: palette.textMuted, padding: spacing.lg }}>No photos yet</Text>
            )}
          </View>
        ) : (
          <View style={styles.menuSection}>
            {menuByCategory.map(({ category, items }, ci) => (
              <View key={category} style={styles.menuCategory}>
                <Text style={[styles.menuCategoryTitle, { color: palette.espresso }]}>
                  {category}
                </Text>
                {items.map((item, ii) => (
                  <MenuCard key={item._id} item={item} index={ci * 10 + ii} palette={palette} />
                ))}
              </View>
            ))}
            {!menuItems.length && (
              <Text style={{ color: palette.textMuted, padding: spacing.lg }}>Menu coming soon</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + spacing.sm }]}>
        <LinearGradient
          colors={[palette.coffeeBrown, palette.darkCoffee]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.directionsBtn}
        >
          <Pressable onPress={openDirections} style={styles.directionsInner}>
            <Text style={styles.directionsText}>📍 Get Directions</Text>
          </Pressable>
        </LinearGradient>
      </View>

      <GalleryModal
        images={images}
        startIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </View>
  );
}

function InfoLine({
  icon,
  text,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  palette: { textSecondary: string; coffeeBrown: string };
}) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={16} color={palette.coffeeBrown} />
      <Text style={[styles.infoText, { color: palette.textSecondary }]}>{text}</Text>
    </View>
  );
}

function Badge({
  label,
  palette,
  accent,
}: {
  label: string;
  palette: { cream: string; coffeeBrown: string };
  accent?: string;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.cream,
          borderColor: accent ?? palette.coffeeBrown,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: accent ?? palette.coffeeBrown }]}>{label}</Text>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  palette: { white: string; border: string; coffeeBrown: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionChip, { backgroundColor: palette.white, borderColor: palette.border }]}
    >
      <Ionicons name={icon} size={20} color={palette.coffeeBrown} />
      <Text style={{ color: palette.coffeeBrown, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function TabButton({
  active,
  label,
  onPress,
  palette,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  palette: { coffeeBrown: string; textMuted: string };
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text
        style={{
          fontWeight: '700',
          fontSize: 14,
          color: active ? palette.coffeeBrown : palette.textMuted,
        }}
      >
        {label}
      </Text>
      {active && <View style={[styles.tabUnderline, { backgroundColor: palette.coffeeBrown }]} />}
    </Pressable>
  );
}

function MenuCard({
  item,
  index,
  palette,
}: {
  item: MenuItem;
  index: number;
  palette: {
    white: string;
    espresso: string;
    textMuted: string;
    forestGreen: string;
    goldAccent: string;
  };
}) {
  const available = item.available !== false;
  return (
    <Animated.View entering={FadeInUp.delay((index % 8) * 40).springify()}>
      <View style={[styles.menuCard, { backgroundColor: palette.white }]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.menuImage} />
        ) : (
          <View style={[styles.menuImage, styles.menuImagePlaceholder]}>
            <Text>☕</Text>
          </View>
        )}
        <View style={styles.menuBody}>
          <View style={styles.menuTitleRow}>
            <View style={[styles.availDot, { backgroundColor: available ? palette.forestGreen : '#999' }]} />
            <Text style={[styles.menuName, { color: palette.espresso }]} numberOfLines={2}>
              {item.item_name}
            </Text>
          </View>
          <Text style={{ color: palette.textMuted, fontSize: 12 }}>{item.Category || 'Menu'}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 11, marginTop: 2 }}>
            {available ? 'Available' : 'Unavailable'}
          </Text>
        </View>
        <Text style={[styles.menuPrice, { color: palette.goldAccent }]}>₹{item.price}</Text>
      </View>
    </Animated.View>
  );
}

function GalleryModal({
  images,
  startIndex,
  visible,
  onClose,
}: {
  images: string[];
  startIndex: number;
  visible: boolean;
  onClose: () => void;
}) {
  const listRef = useRef<FlatList>(null);
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    if (visible) {
      setIdx(startIndex);
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: startIndex, animated: false });
      }, 50);
    }
  }, [visible, startIndex]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.galleryBg}>
        <Pressable style={styles.galleryClose} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => {
            setIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
          }}
          keyExtractor={(u, i) => `${u}-${i}`}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="contain" />
          )}
        />
        <Text style={styles.galleryCounter}>
          {idx + 1} / {images.length}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrap: { height: HERO_H, backgroundColor: '#E8DDD2' },
  heroImage: { width: SCREEN_W, height: HERO_H },
  counter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  back: {
    position: 'absolute',
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.full,
    padding: 8,
  },
  heroHeart: { position: 'absolute', right: spacing.md },
  info: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  shopIcon: { fontSize: 20, marginTop: 4 },
  name: { ...typography.h2, flex: 1 },
  category: { fontSize: 14, marginTop: 4, marginBottom: spacing.md },
  infoLine: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  tagline: { fontStyle: 'italic', textAlign: 'center', marginVertical: spacing.md, fontSize: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: spacing.md },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm },
  actionChip: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 72,
    gap: 4,
  },
  saveChip: { alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginHorizontal: spacing.lg,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabBtnActive: {},
  tabUnderline: { height: 3, width: '60%', borderRadius: 2, marginTop: 6 },
  photosSection: { padding: spacing.lg },
  sectionHeading: { ...typography.h3, marginBottom: spacing.md },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoCell: {
    width: (SCREEN_W - spacing.lg * 2 - spacing.sm) / 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  photoThumb: { width: '100%', aspectRatio: 1 },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  photoBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  menuSection: { padding: spacing.lg, paddingTop: spacing.md },
  menuCategory: { marginBottom: spacing.lg },
  menuCategoryTitle: { ...typography.h3, marginBottom: spacing.md },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  menuImage: { width: 72, height: 72, borderRadius: radius.md },
  menuImagePlaceholder: {
    backgroundColor: '#EDE0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  menuName: { fontWeight: '700', fontSize: 15, flex: 1 },
  menuPrice: { fontWeight: '700', fontSize: 16 },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(255,248,240,0.95)',
  },
  directionsBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  directionsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 8,
  },
  directionsText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  galleryBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  galleryClose: { position: 'absolute', top: 48, right: 20, zIndex: 2 },
  galleryImage: { width: SCREEN_W, height: '80%' },
  galleryCounter: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
