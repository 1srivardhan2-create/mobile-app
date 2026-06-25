import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import type { RootStackParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const steam = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    steam.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.3, { duration: 1000 })),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 400 }), withTiming(1, { duration: 400 })),
      -1,
      false,
    );
  }, [steam, pulse]);

  const steamStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + steam.value * 0.5,
    transform: [{ translateY: -8 * steam.value }],
  }));

  const btnPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <LinearGradient colors={[palette.cream, '#EDE0D4', palette.cream]} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.illustration}>
        <Animated.Text style={[styles.steam, steamStyle]}>~ ~ ~</Animated.Text>
        <Text style={styles.cup}>☕</Text>
      </Animated.View>

      <Animated.Text
        entering={FadeIn.duration(500).delay(500)}
        style={[styles.title, { color: palette.espresso }]}
      >
        CAFFÉLINO
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.duration(500).delay(700)}
        style={[styles.subtitle, { color: palette.textSecondary }]}
      >
        Find Your Perfect Café
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(500).delay(900)} style={[styles.btnWrap, btnPulse]}>
        <Button
          label="Start Exploring →"
          onPress={() => navigation.navigate('MobileNumber')}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: { alignItems: 'center', marginBottom: spacing.xl },
  steam: { fontSize: 28, color: '#A67B5B', letterSpacing: 6, marginBottom: 8 },
  cup: { fontSize: 100 },
  title: { ...typography.logo, marginBottom: spacing.sm },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.xxl },
  btnWrap: { width: '100%' },
});
