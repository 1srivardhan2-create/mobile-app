import React, { useRef, useEffect } from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}

export function OtpInput({ length = 6, value, onChange, onComplete }: OtpInputProps) {
  const { palette } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const bounce = useSharedValue(1);

  useEffect(() => {
    if (value.length === length) {
      bounce.value = withSequence(
        withSpring(1.08, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
      onComplete?.(value);
    }
  }, [value, length, onComplete, bounce]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));

  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {digits.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.box,
            boxStyle,
            {
              borderColor: d.trim() ? palette.goldAccent : palette.border,
              backgroundColor: palette.white,
            },
          ]}
        >
          <Animated.Text style={[styles.digit, { color: palette.espresso }]}>
            {d.trim() || ''}
          </Animated.Text>
        </Animated.View>
      ))}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hidden}
        autoFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 22, fontWeight: '700' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
