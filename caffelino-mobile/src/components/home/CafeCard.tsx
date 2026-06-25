import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { FavoriteHeart } from '../favorites/FavoriteHeart';
import { useTheme } from '../../context/ThemeContext';
import { getCafeCover } from '../../utils/cafeImages';
import { radius, shadows, spacing } from '../../theme';
import type { Cafe } from '../../types';

interface CafeCardProps {
  cafe: Cafe;
  index?: number;
  onPress: () => void;
  compact?: boolean;
  fullWidth?: boolean;
}

export function CafeCard({ cafe, index = 0, onPress, compact, fullWidth }: CafeCardProps) {
  const { palette } = useTheme();
  const imageUri = getCafeCover(cafe);

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(400).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          shadows.card,
          {
            backgroundColor: palette.white,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
          compact && styles.compact,
          fullWidth && styles.fullWidth,
        ]}
      >
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: palette.latteBrown }]}>
              <Text style={styles.placeholderEmoji}>☕</Text>
            </View>
          )}
          <FavoriteHeart cafeId={cafe._id} cafe={cafe} style={styles.heart} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, { color: palette.espresso }]} numberOfLines={1}>
            {cafe.Name}
          </Text>
          {cafe.Cafe_Address ? (
            <Text style={[styles.address, { color: palette.textMuted }]} numberOfLines={1}>
              {cafe.Cafe_Address}
            </Text>
          ) : null}
          {cafe.Average_Cost != null && (
            <Text style={[styles.cost, { color: palette.goldAccent }]}>
              ₹{cafe.Average_Cost} avg
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    width: 260,
    marginRight: spacing.md,
  },
  compact: { width: 200 },
  fullWidth: { width: '100%', marginRight: 0 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 140 },
  heart: { position: 'absolute', top: 8, right: 8 },
  placeholder: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 48 },
  body: { padding: spacing.md },
  name: { fontSize: 16, fontWeight: '700' },
  address: { fontSize: 12, marginTop: 4 },
  cost: { fontSize: 13, fontWeight: '600', marginTop: 6 },
});
