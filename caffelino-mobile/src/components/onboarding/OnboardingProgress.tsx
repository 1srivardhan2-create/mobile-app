import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

interface OnboardingProgressProps {
  step: 1 | 2 | 3 | 4;
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  const { palette } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.row}>
      {[1, 2, 3, 4].map((n) => (
        <View
          key={n}
          style={[
            styles.dot,
            {
              backgroundColor: n <= step ? palette.coffeeBrown : palette.border,
              width: n === step ? 28 : 8,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
