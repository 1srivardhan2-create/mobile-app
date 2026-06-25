import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { IllustratedAvatar } from '../../../components/onboarding/IllustratedAvatar';
import { OnboardingBackground } from '../../../components/onboarding/OnboardingBackground';
import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { getAvatarsByGender } from '../../../constants/avatars';
import { useTheme } from '../../../context/ThemeContext';
import type { RootStackParamList } from '../../../types';
import { spacing, radius, typography, shadows } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingAvatar'>;
const { width, height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OnboardingAvatarScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { mobileNumber, countryCode, fullName, gender } = route.params;
  const avatars = getAvatarsByGender(gender);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const btnScale = useSharedValue(1);

  useEffect(() => {
    if (selectedId) {
      btnScale.value = withRepeat(
        withSequence(withTiming(1.02, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
    } else {
      btnScale.value = withTiming(1);
    }
  }, [selectedId, btnScale]);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
  };

  const handleContinue = () => {
    if (!selectedId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowWelcome(true);

    setTimeout(() => {
      navigation.navigate('OnboardingReady', {
        mobileNumber,
        countryCode,
        fullName,
        gender,
        avatarId: selectedId,
      });
    }, 2500);
  };

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const selectedAvatar = avatars.find((a) => a.id === selectedId);

  return (
    <>
      <OnboardingBackground showSteam={false}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingProgress step={3} />

          <Animated.Text entering={FadeInDown.duration(500)} style={[styles.title, { color: palette.espresso }]}>
            Choose Your Avatar
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(500).delay(100)} style={[styles.subtitle, { color: palette.textSecondary }]}>
            Pick a look that feels like you.
          </Animated.Text>

          <View style={styles.grid}>
            {avatars.map((avatar, index) => (
              <AvatarPickerCard
                key={avatar.id}
                avatar={avatar}
                selected={selectedId === avatar.id}
                onSelect={() => handleSelect(avatar.id)}
                delay={120 + index * 80}
              />
            ))}
          </View>

          <Animated.View entering={FadeInUp.duration(500).delay(400)}>
            <AnimatedPressable
              onPress={handleContinue}
              disabled={!selectedId}
              style={[btnAnimStyle, { marginTop: spacing.lg }]}
            >
              <LinearGradient
                colors={selectedId ? [palette.coffeeBrown, palette.darkCoffee] : ['#D3D3D3', '#C0C0C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.continueBtn, selectedId && shadows.card]}
              >
                <Text style={styles.continueText}>Continue ☕</Text>
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>
      </OnboardingBackground>

      {showWelcome && selectedAvatar && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          exiting={FadeOut.duration(300)}
          style={[StyleSheet.absoluteFill, styles.welcomeOverlay, { backgroundColor: palette.warmCream }]}
        >
          <WelcomeContent avatar={selectedAvatar} name={fullName} />
        </Animated.View>
      )}
    </>
  );
}

function WelcomeContent({ avatar, name }: { avatar: any; name: string }) {
  const { palette } = useTheme();
  const wave = useSharedValue(0);

  useEffect(() => {
    wave.value = withDelay(
      300,
      withSequence(
        withTiming(-15, { duration: 150 }),
        withTiming(15, { duration: 150 }),
        withTiming(-10, { duration: 150 }),
        withTiming(10, { duration: 150 }),
        withTiming(0, { duration: 150 })
      )
    );
  }, [wave]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wave.value}deg` }],
  }));

  return (
    <View style={styles.welcomeContent}>
      <Animated.View entering={ZoomIn.duration(600).springify()} style={[styles.welcomeAvatarWrap, shadows.card]}>
        <Animated.View style={avatarStyle}>
          <IllustratedAvatar avatar={avatar} size={140} />
        </Animated.View>
      </Animated.View>

      <Animated.Text entering={FadeInUp.duration(500).delay(400)} style={[styles.welcomeTitle, { color: palette.espresso }]}>
        Welcome to Caffelino ☕
      </Animated.Text>

      <Animated.Text entering={FadeInUp.duration(500).delay(600)} style={[styles.welcomeSubtitle, { color: palette.textSecondary }]}>
        Hey {name?.split(' ')[0] || 'there'},{'\n'}Let's discover great cafés together.
      </Animated.Text>
    </View>
  );
}

function AvatarPickerCard({
  avatar,
  selected,
  onSelect,
  delay,
}: {
  avatar: any;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const waveRotate = useSharedValue(0);
  const waveTranslateX = useSharedValue(0);
  const bubbleScale = useSharedValue(1);
  const floatBeans = useSharedValue(0);
  const [speechText, setSpeechText] = useState('🤚💬');

  useEffect(() => {
    if (selected) {
      // Gentle card pop
      scale.value = withSequence(
        withSpring(0.98, { damping: 12, stiffness: 200 }),
        withSpring(1.03, { damping: 12, stiffness: 200 })
      );
      
      // gentleWave keyframes: 12deg/3px -> -6deg/-2px -> 8deg/1px -> 0
      waveRotate.value = withSequence(
        withTiming(12, { duration: 175, easing: Easing.inOut(Easing.ease) }),
        withTiming(-6, { duration: 175, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 175, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 175, easing: Easing.inOut(Easing.ease) })
      );
      waveTranslateX.value = withSequence(
        withTiming(3, { duration: 175, easing: Easing.inOut(Easing.ease) }),
        withTiming(-2, { duration: 175, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 175, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 175, easing: Easing.inOut(Easing.ease) })
      );

      // Hi Text & Pop
      setSpeechText('👋 Hi! 👋');
      bubbleScale.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withTiming(1.1, { duration: 320, easing: Easing.bezier(0.34, 1.2, 0.64, 1) }),
        withTiming(1, { duration: 80 })
      );

      floatBeans.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );

      const timer = setTimeout(() => {
        setSpeechText('🤚💬');
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      setSpeechText('🤚💬');
      bubbleScale.value = 1;
    }
  }, [selected, scale, waveRotate, waveTranslateX, bubbleScale, floatBeans]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${waveRotate.value}deg` },
      { translateX: waveTranslateX.value }
    ],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
  }));

  const beanStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatBeans.value * -5 }, { rotate: `${floatBeans.value * 10}deg` }],
    opacity: floatBeans.value * 0.8 + 0.2,
  }));

  const beanStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: floatBeans.value * 5 }, { rotate: `${-floatBeans.value * 10}deg` }],
    opacity: floatBeans.value * 0.8 + 0.2,
  }));

  return (
    <Animated.View entering={FadeInUp.duration(450).delay(delay)} style={styles.cardWrap}>
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={() => {
          if (!selected) scale.value = withSpring(0.95, { damping: 12 });
        }}
        onPressOut={() => {
          if (!selected) scale.value = withSpring(1, { damping: 12 });
        }}
        style={animStyle}
      >
        <View
          style={[
            styles.avatarCard,
            shadows.card,
            {
               backgroundColor: selected ? '#fff2df' : palette.cream,
               borderColor: selected ? '#b13e3e' : 'transparent',
               borderWidth: selected ? 2 : 0,
            },
          ]}
        >
          {selected && (
            <>
              <View style={[styles.glowRing, { backgroundColor: palette.goldAccent }]} />
              <Animated.Text style={[styles.floatingBean, { left: 4, top: 10 }, beanStyle1]}>🫘</Animated.Text>
              <Animated.Text style={[styles.floatingBean, { right: 4, bottom: 10 }, beanStyle2]}>🫘</Animated.Text>
              
              <View style={[styles.checkBadge, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            </>
          )}

          <Animated.View style={avatarStyle}>
            <IllustratedAvatar avatar={avatar} size={76} />
          </Animated.View>

          <Animated.View style={[styles.speechBubble, { backgroundColor: selected ? '#fff2df' : palette.white, borderColor: selected ? '#b13e3e' : palette.border }, bubbleStyle]}>
            <Text style={[styles.speechText, { color: selected ? '#b13e3e' : palette.espresso }]}>{speechText}</Text>
          </Animated.View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  cardWrap: { width: '30%' },
  avatarCard: {
    borderRadius: radius.xl,
    padding: spacing.sm,
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
    height: 120,
    justifyContent: 'center',
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    opacity: 0.15,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  floatingBean: {
    position: 'absolute',
    fontSize: 12,
    zIndex: 5,
  },
  speechBubble: {
    position: 'absolute',
    top: -15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  speechText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  continueBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  welcomeOverlay: {
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  welcomeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeAvatarWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeSubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
