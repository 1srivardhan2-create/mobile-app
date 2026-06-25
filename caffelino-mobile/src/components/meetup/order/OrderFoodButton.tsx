import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadows, spacing } from '../../../theme';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function OrderFoodButton({ onPress, disabled, readOnly }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );
  }, [scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: disabled ? 1 : scale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={pulseStyle}>
        <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed]}>
          <LinearGradient
            colors={disabled ? ['#AAA', '#888'] : ['#D4A373', '#6F4E37', '#3E2723']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.btn, shadows.card]}
          >
            <Ionicons name={readOnly ? 'clipboard-outline' : 'cart'} size={20} color="#FFF" />
            <Text style={styles.label}>{readOnly ? 'View Food' : 'Order Food'}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    marginTop: 16,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    minWidth: 200,
  },
  label: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.9 },
});
