import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import type { RootStackParamList } from '../../types';
import { typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const LETTERS = 'CAFFÉLINO'.split('');

export function SplashScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const beanRotate = useSharedValue(0);
  const aroma = useSharedValue(0);
  const glow = useSharedValue(0);
  const [visibleLetters, setVisibleLetters] = useState(0);

  useEffect(() => {
    beanRotate.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    aroma.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.2, { duration: 800 }),
      ),
      -1,
      true,
    );
    glow.value = withDelay(1800, withTiming(1, { duration: 600 }));

    const letterTimer = setInterval(() => {
      setVisibleLetters((n) => {
        if (n >= LETTERS.length) {
          clearInterval(letterTimer);
          return n;
        }
        return n + 1;
      });
    }, 120);

    const navTimer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2500);

    return () => {
      clearInterval(letterTimer);
      clearTimeout(navTimer);
    };
  }, [navigation, beanRotate, aroma, glow]);

  const beanStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${beanRotate.value}deg` }],
  }));

  const aromaStyle = useAnimatedStyle(() => ({
    opacity: aroma.value * 0.6,
    transform: [{ translateY: -20 * aroma.value }, { scale: 1 + aroma.value * 0.3 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.5,
    transform: [{ scale: 1 + glow.value * 0.15 }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: palette.espresso }]}>
      <Animated.View style={[styles.glow, glowStyle, { backgroundColor: palette.goldAccent }]} />
      <Animated.Text style={[styles.bean, beanStyle]}>🫘</Animated.Text>
      <Animated.View style={[styles.aroma, aromaStyle]}>
        <Text style={styles.aromaText}>~ ~ ~</Text>
      </Animated.View>
      <View style={styles.logoRow}>
        {LETTERS.map((letter, i) => (
          <Text
            key={i}
            style={[
              styles.letter,
              {
                color: palette.cream,
                opacity: i < visibleLetters ? 1 : 0,
              },
            ]}
          >
            {letter}
          </Text>
        ))}
      </View>
      <Text style={[styles.tagline, { color: palette.goldAccent }]}>Premium Café Discovery</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  bean: { fontSize: 56, marginBottom: 8 },
  aroma: { marginBottom: 24 },
  aromaText: { fontSize: 24, color: '#D4A373', letterSpacing: 8 },
  logoRow: { flexDirection: 'row' },
  letter: { ...typography.logo, fontSize: 28 },
  tagline: { marginTop: 16, fontSize: 12, letterSpacing: 2 },
});
