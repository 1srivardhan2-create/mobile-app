import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../components/ui/Button';
import { CoffeeLoader } from '../../../components/ui/CoffeeLoader';
import { IllustratedAvatar } from '../../../components/onboarding/IllustratedAvatar';
import { OnboardingBackground } from '../../../components/onboarding/OnboardingBackground';
import { getAvatarById } from '../../../constants/avatars';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import type { RootStackParamList } from '../../../types';
import { spacing, typography } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingReady'>;

export function OnboardingReadyScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { finishOnboarding } = useAuth();
  const { mobileNumber, fullName, gender, avatarId } = route.params;
  const avatar = getAvatarById(avatarId);
  const [loading, setLoading] = useState(false);

  const cupBounce = useSharedValue(0);
  const celebrate = useSharedValue(0);

  useEffect(() => {
    cupBounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    celebrate.value = withTiming(1, { duration: 800 });
  }, [cupBounce, celebrate]);

  const cupStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cupBounce.value * -8 }, { scale: 1 + cupBounce.value * 0.04 }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: celebrate.value,
    transform: [{ scale: 0.85 + celebrate.value * 0.15 }],
  }));

  const handleEnter = async () => {
    setLoading(true);
    try {
      await finishOnboarding({
        fullName,
        mobileNumber,
        avatarId,
        gender,
      });
    } catch (e) {
      Alert.alert('Something went wrong', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingBackground>
      <View style={[styles.flex, { paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.lg }]}>
        <Animated.View style={[styles.avatarHero, avatarStyle]}>
          <IllustratedAvatar avatar={avatar} size={140} />
        </Animated.View>

        <Animated.Text entering={FadeIn.duration(600).delay(300)} style={[styles.title, { color: palette.espresso }]}>
          Welcome to Caffélino ☕
        </Animated.Text>
        <Animated.Text entering={FadeIn.duration(600).delay(450)} style={[styles.subtitle, { color: palette.textSecondary }]}>
          Your profile is ready.
        </Animated.Text>
        <Animated.Text entering={FadeIn.duration(600).delay(550)} style={[styles.name, { color: palette.coffeeBrown }]}>
          {fullName}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(600).delay(650)} style={cupStyle}>
          <Text style={styles.cup}>☕</Text>
        </Animated.View>

        <Animated.Text entering={FadeIn.duration(500).delay(800)} style={styles.confetti}>
          ✨ 🫘 🌿 ✨
        </Animated.Text>

        <View style={styles.footer}>
          {loading ? (
            <CoffeeLoader message="Setting up your profile…" />
          ) : (
            <Animated.View entering={FadeInUp.duration(500).delay(900)} style={{ width: '100%' }}>
              <Button label="Enter Caffélino" onPress={handleEnter} />
            </Animated.View>
          )}
        </View>
      </View>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignItems: 'center' },
  avatarHero: { marginBottom: spacing.lg },
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.body, textAlign: 'center' },
  name: { fontSize: 20, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.lg },
  cup: { fontSize: 56, marginVertical: spacing.md },
  confetti: { fontSize: 22, letterSpacing: 4, marginBottom: spacing.lg },
  footer: { width: '100%', marginTop: 'auto', paddingBottom: spacing.xl },
});
