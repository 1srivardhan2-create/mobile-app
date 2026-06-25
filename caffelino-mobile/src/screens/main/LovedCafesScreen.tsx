import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FavoriteHeart } from '../../components/favorites/FavoriteHeart';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { getCafeCover } from '../../utils/cafeImages';
import type { Cafe, MainStackParamList, MainTabParamList } from '../../types';
import { radius, shadows, spacing, typography } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Loved'>,
  NativeStackScreenProps<MainStackParamList>
>;

export function LovedCafesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { lovedCafes, loading, refresh } = useFavorites();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openCafe = (cafe: Cafe) => {
    navigation.navigate('CafeDetails', { cafeId: cafe._id, initialCafe: cafe });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: palette.espresso }]}>Loved Cafés</Text>

      {loading && !lovedCafes.length ? (
        <CoffeeLoader message="Loading your favorites..." />
      ) : lovedCafes.length === 0 ? (
        <EmptyState
          palette={palette}
          onExplore={() => navigation.navigate('Explore')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.coffeeBrown} />
          }
        >
          {lovedCafes.map((cafe, i) => (
            <LovedCafeCard
              key={cafe._id}
              cafe={cafe}
              index={i}
              palette={palette}
              onPress={() => openCafe(cafe)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState({
  palette,
  onExplore,
}: {
  palette: { espresso: string; textMuted: string; coffeeBrown: string; white: string };
  onExplore: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Animated.Text entering={FadeInUp} style={styles.emptyEmoji}>
        ☕
      </Animated.Text>
      <Text style={[styles.emptyTitle, { color: palette.espresso }]}>No loved cafés yet</Text>
      <Text style={[styles.emptySub, { color: palette.textMuted }]}>Start exploring cafés</Text>
      <Pressable
        onPress={onExplore}
        style={[styles.exploreBtn, { backgroundColor: palette.coffeeBrown }]}
      >
        <Text style={styles.exploreBtnText}>Explore Cafés</Text>
      </Pressable>
    </View>
  );
}

function LovedCafeCard({
  cafe,
  index,
  palette,
  onPress,
}: {
  cafe: Cafe;
  index: number;
  palette: { espresso: string; textMuted: string; goldAccent: string; white: string };
  onPress: () => void;
}) {
  const cover = getCafeCover(cafe);
  const rating = cafe.rating ?? 4.5;
  const cost = cafe.costForOne ?? cafe.Average_Cost;

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          shadows.card,
          { backgroundColor: palette.white, opacity: pressed ? 0.96 : 1 },
        ]}
      >
        <View style={styles.cardImageWrap}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Text style={{ fontSize: 40 }}>☕</Text>
            </View>
          )}
          <FavoriteHeart cafeId={cafe._id} cafe={cafe} style={styles.cardHeart} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardName, { color: palette.espresso }]} numberOfLines={2}>
            {cafe.Name}
          </Text>
          <Text style={{ color: palette.goldAccent, fontWeight: '600', marginTop: 4 }}>
            ⭐ {rating.toFixed(1)}
          </Text>
          {cafe.Cafe_Address ? (
            <Text style={[styles.cardMeta, { color: palette.textMuted }]} numberOfLines={2}>
              📍 {cafe.Cafe_Address}
            </Text>
          ) : null}
          {cost != null && (
            <Text style={[styles.cardMeta, { color: palette.textMuted }]}>₹{cost} Avg</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...typography.h2, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: { fontSize: 72, marginBottom: spacing.lg },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptySub: { ...typography.body, marginTop: spacing.sm, marginBottom: spacing.xl },
  exploreBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 180 },
  cardPlaceholder: {
    backgroundColor: '#E8DDD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeart: { position: 'absolute', top: 12, right: 12 },
  cardBody: { padding: spacing.md },
  cardName: { fontSize: 18, fontWeight: '700' },
  cardMeta: { fontSize: 13, marginTop: 6, lineHeight: 18 },
});
