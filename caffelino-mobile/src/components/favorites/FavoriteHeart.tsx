import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFavorites } from '../../context/FavoritesContext';
import type { Cafe } from '../../types';

type Props = {
  cafeId: string;
  cafe?: Cafe;
  size?: number;
  style?: object;
};

export function FavoriteHeart({ cafeId, cafe, size = 22, style }: Props) {
  const { isLoved, toggle } = useFavorites();
  const loved = isLoved(cafeId);
  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const floatOpacity = useSharedValue(0);
  const busy = useRef(false);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    opacity: floatOpacity.value,
    transform: [{ translateY: floatY.value }],
  }));

  const onPress = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!loved) {
        scale.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(1, { duration: 200 }),
        );
        floatOpacity.value = 1;
        floatY.value = 0;
        floatY.value = withSequence(
          withTiming(-20, { duration: 200 }),
          withTiming(-32, { duration: 200 }),
        );
        floatOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 200 }),
        );
      } else {
        scale.value = withSequence(
          withTiming(0.85, { duration: 150 }),
          withTiming(1, { duration: 150 }),
        );
      }
      await toggle(cafeId, cafe);
    } finally {
      busy.current = false;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={[styles.wrap, style]}
      accessibilityRole="button"
      accessibilityLabel={loved ? 'Remove from loved cafes' : 'Save cafe'}
    >
      <Animated.Text style={[styles.heart, { fontSize: size }, heartStyle]}>
        {loved ? '❤️' : '🤍'}
      </Animated.Text>
      {!loved ? null : (
        <Animated.View style={[styles.floatHearts, floatStyle]} pointerEvents="none">
          <Text style={styles.mini}>❤️</Text>
          <Text style={[styles.mini, styles.mini2]}>❤️</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  heart: {},
  floatHearts: {
    position: 'absolute',
    top: -4,
    flexDirection: 'row',
    gap: 2,
  },
  mini: { fontSize: 10 },
  mini2: { marginLeft: 4, opacity: 0.7 },
});
