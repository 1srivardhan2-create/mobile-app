import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingParticles } from './FloatingParticles';

const { width, height } = Dimensions.get('window');

function SteamPuff({ offset }: { offset: number }) {
  const rise = useSharedValue(0);

  useEffect(() => {
    rise.value = withDelay(
      offset,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, [offset, rise]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - rise.value) * 0.35,
    transform: [{ translateY: -rise.value * 40 }, { scale: 0.6 + rise.value * 0.5 }],
  }));

  return <Animated.View style={[styles.steamPuff, style]} />;
}

interface OnboardingBackgroundProps {
  children: React.ReactNode;
  showSteam?: boolean;
}

export function OnboardingBackground({ children, showSteam = true }: OnboardingBackgroundProps) {
  return (
    <LinearGradient colors={['#F5E6D3', '#EDE0D4', '#F5E6D3']} style={styles.root}>
      <FloatingParticles />
      <View style={styles.decor} pointerEvents="none">
        {showSteam && (
          <View style={styles.steamWrap}>
            <SteamPuff offset={0} />
            <SteamPuff offset={700} />
            <SteamPuff offset={1400} />
          </View>
        )}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  decor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bean: { position: 'absolute', backgroundColor: '#6F4E37' },
  steamWrap: { position: 'absolute', top: height * 0.06, alignSelf: 'center', left: width * 0.42 },
  steamPuff: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  leaf: {
    width: 18,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#7CB342',
    transform: [{ rotate: '-30deg' }],
  },
  leafSmall: {
    width: 12,
    height: 7,
    marginTop: -4,
    marginLeft: 8,
    backgroundColor: '#8BC34A',
  },
  particle: { position: 'absolute', backgroundColor: '#D4A373' },
  grassLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(124, 179, 66, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 179, 66, 0.15)',
  },
});
