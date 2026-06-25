import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing } from '../../theme';

interface MyMeetupsHomeCardProps {
  onPress: () => void;
}

export function MyMeetupsHomeCard({ onPress }: MyMeetupsHomeCardProps) {
  const { palette } = useTheme();

  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.92 : 1 }]}
      >
        <LinearGradient
          colors={[palette.coffeeBrown, palette.goldAccent, '#C4A574']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, shadows.card]}
        >
          <Text style={[styles.btnText, { color: palette.darkCoffee }]}>☕ View My Meetups</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  pressable: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
