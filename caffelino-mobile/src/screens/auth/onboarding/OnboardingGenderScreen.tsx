import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { OnboardingBackground } from '../../../components/onboarding/OnboardingBackground';
import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { useTheme } from '../../../context/ThemeContext';
import type { RootStackParamList } from '../../../types';
import { spacing, radius, typography, shadows } from '../../../theme';
import { IllustratedAvatar } from '../../../components/onboarding/IllustratedAvatar';
import { getAvatarsByGender, IllustratedAvatarOption } from '../../../constants/avatars';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingGender'>;
type Gender = 'male' | 'female';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OnboardingGenderScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { mobileNumber, countryCode, fullName } = route.params;
  const [selected, setSelected] = useState<Gender | null>(null);

  const maleAvatar = getAvatarsByGender('male')[0];
  const femaleAvatar = getAvatarsByGender('female')[0];

  const handleSelect = (gender: Gender) => {
    if (selected) return; // Prevent multiple taps
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(gender);
    
    // Automatically transition after animation (1.5s total)
    setTimeout(() => {
      navigation.navigate('OnboardingAvatar', {
        mobileNumber,
        countryCode,
        fullName,
        gender,
      });
    }, 1500);
  };

  return (
    <OnboardingBackground showSteam={false}>
      <View style={[styles.flex, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <OnboardingProgress step={2} />

        <Animated.Text entering={FadeInDown.duration(500)} style={[styles.title, { color: palette.espresso }]}>
          Tell us a little about yourself ☕
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(500).delay(100)} style={[styles.subtitle, { color: palette.textSecondary }]}>
          This helps us personalize your experience.
        </Animated.Text>

        <View style={styles.cards}>
          <GenderCard
            label="Male"
            avatar={maleAvatar}
            selected={selected === 'male'}
            speechText="👋 Hi there!"
            onPress={() => handleSelect('male')}
            delay={150}
          />
          <GenderCard
            label="Female"
            avatar={femaleAvatar}
            selected={selected === 'female'}
            speechText="👋 Hello!"
            onPress={() => handleSelect('female')}
            delay={250}
          />
        </View>

        <View style={styles.footer} />
      </View>
    </OnboardingBackground>
  );
}

function GenderCard({
  label,
  avatar,
  selected,
  speechText,
  onPress,
  delay,
}: {
  label: string;
  avatar: IllustratedAvatarOption;
  selected: boolean;
  speechText: string;
  onPress: () => void;
  delay: number;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const wave = useSharedValue(0);
  const bubbleScale = useSharedValue(0);

  React.useEffect(() => {
    if (selected) {
      scale.value = withSpring(1.03, { damping: 14, stiffness: 180 });
      wave.value = withSequence(
        withTiming(-15, { duration: 150 }),
        withTiming(15, { duration: 150 }),
        withTiming(-10, { duration: 150 }),
        withTiming(10, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
      bubbleScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 180 }));
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      bubbleScale.value = 0;
    }
  }, [selected, scale, wave, bubbleScale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wave.value}deg` }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: bubbleScale.value,
  }));

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(delay)} style={[styles.cardWrap, animStyle]}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          if (!selected) scale.value = withSpring(0.97, { damping: 14 });
        }}
        onPressOut={() => {
          if (!selected) scale.value = withSpring(1, { damping: 14 });
        }}
        style={[
          styles.card,
          shadows.card,
          {
            backgroundColor: palette.cream,
            borderColor: selected ? palette.goldAccent : palette.border,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        {selected && <View style={[styles.glow, { backgroundColor: palette.coffeeBrown }]} />}
        
        <View style={styles.avatarContainer}>
          <Animated.View style={avatarStyle}>
            <IllustratedAvatar avatar={avatar} size={88} />
          </Animated.View>
          
          <Animated.View style={[styles.speechBubble, { backgroundColor: palette.white, borderColor: palette.border }, bubbleStyle]}>
            <Text style={[styles.speechText, { color: palette.espresso }]}>{speechText}</Text>
          </Animated.View>
        </View>

        <Text style={[styles.cardLabel, { color: selected ? palette.espresso : palette.textSecondary }]}>{label}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  cards: { flex: 1, gap: spacing.md },
  cardWrap: { flex: 1, maxHeight: 220 },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    minHeight: 180,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    opacity: 0.1,
  },
  avatarContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  speechBubble: {
    position: 'absolute',
    right: -60,
    top: -20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speechText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardLabel: { fontSize: 22, fontWeight: '800' },
  footer: { paddingVertical: spacing.xl },
});
