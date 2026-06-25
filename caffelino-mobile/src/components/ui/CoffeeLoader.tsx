import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeOut,
  ZoomOut,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface CoffeeLoaderProps {
  message?: string;
  mini?: boolean;
}

export function CoffeeLoader({ message = 'Brewing Your Coffee Experience', mini = false }: CoffeeLoaderProps) {
  const insets = useSafeAreaInsets();
  const [displayMsg, setDisplayMsg] = useState(message.replace(/[.●]/g, '').trim());
  const [dotCount, setDotCount] = useState(1);
  const bgScale = useSharedValue(1);

  // Background breathing animation
  useEffect(() => {
    bgScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [bgScale]);

  // 10s slow network message
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayMsg('Preparing your coffee experience');
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Text Dots animation
  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1); // 1, 2, 3
    }, 600);
    return () => clearInterval(dotTimer);
  }, []);

  const dots = '●'.repeat(dotCount);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, mini && { backgroundColor: 'transparent', paddingVertical: 20 }]}
      entering={FadeIn.duration(800)}
      exiting={FadeOut.duration(500)}
    >
      {!mini && (
        <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
          <LinearGradient
            colors={['#4A2C20', '#5A3828', '#6B4632']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Breathing Glows */}
          <View style={styles.glowSpot1} />
          <View style={styles.glowSpot2} />
        </Animated.View>
      )}
      
      {/* Aroma & Steam */}
      {!mini && <SteamEffect />}
      {!mini && <Particles />}

      <View style={styles.content}>
        <Animated.View exiting={ZoomOut.duration(500)} style={[styles.beansRow, mini && { marginBottom: 16, height: 60 }]}>
          <RealisticBean index={0} />
          <RealisticBean index={1} />
          <RealisticBean index={2} />
          <RealisticBean index={3} />
        </Animated.View>

        <Animated.View exiting={FadeOut.duration(500)} style={styles.loadingRow}>
          <Text style={[styles.loadingText, mini && { color: '#6B4632', fontSize: 14 }]}>
            {mini ? '' : '☕ '}{displayMsg}
            <Text style={{ position: 'absolute', fontSize: mini ? 10 : 12, marginLeft: 4 }}> {dots}</Text>
          </Text>
        </Animated.View>
      </View>

      {!mini && (
        <Animated.View exiting={FadeOut.duration(500)} style={[styles.branding, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text style={styles.brandTitle}>☕ Caffelino</Text>
          <Text style={styles.brandSubtitle}>Coffee Meets People</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function RealisticBean({ index }: { index: number }) {
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 250; // Staggered wave effect
    const duration = 1400; // 1.4s as requested

    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(15, { duration: duration / 2, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(10, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(-10, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.95, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [index, y, rotate, scale]);

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: y.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(y.value, [-15, 15], [0.1, 0.4]),
      transform: [
        { scale: interpolate(y.value, [-15, 15], [1.2, 0.8]) }
      ],
    };
  });

  return (
    <View style={styles.beanContainer}>
      <Animated.View style={[styles.beanShadow, shadowStyle]} />
      <Animated.View style={style}>
        <View style={styles.beanOuter}>
          {/* Base realistic color */}
          <LinearGradient
            colors={['#3F2012', '#2A140B', '#110603']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Specular Highlight for 3D gloss */}
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.5, y: 0.8 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* The Groove (S-Curve trick using border radius) */}
          <View style={styles.beanGrooveLeft} />
          <View style={styles.beanGrooveRight} />
        </View>
      </Animated.View>
    </View>
  );
}

function SteamEffect() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Steam index={0} delay={0} left={width / 2 - 40} />
      <Steam index={1} delay={1500} left={width / 2} />
      <Steam index={2} delay={700} left={width / 2 + 30} />
    </View>
  );
}

function Steam({ index, delay, left }: { index: number; delay: number; left: number }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-150, { duration: 4000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.15, { duration: 1000 }),
          withTiming(0.15, { duration: 1000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      )
    );
  }, [y, opacity, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: height / 2,
          left,
          width: 30,
          height: 80,
          backgroundColor: '#E6CBB3',
          borderRadius: 15,
          filter: 'blur(10px)' as any,
        },
        style,
      ]}
    />
  );
}

function Particles() {
  const particles = Array.from({ length: 10 }).map((_, i) => <Particle key={i} index={i} />);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{particles}</View>;
}

function Particle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const randomX = Math.random() * width;
  const size = 2 + Math.random() * 3;
  const duration = 5000 + Math.random() * 4000;
  const delay = Math.random() * 6000;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 0.2, 0.2, 0]),
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [height, -50]) },
        { translateX: Math.sin(progress.value * Math.PI * 3) * 30 }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: randomX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E6CBB3',
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowSpot1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(230, 203, 179, 0.05)',
    top: height * 0.2,
    left: -50,
  },
  glowSpot2: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(230, 203, 179, 0.04)',
    bottom: height * 0.1,
    right: -100,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  beansRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  beanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 52,
  },
  beanOuter: {
    width: 34,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#2A140B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  beanGrooveLeft: {
    position: 'absolute',
    left: -10,
    top: -5,
    bottom: -5,
    width: 24,
    borderRightWidth: 3,
    borderRightColor: '#0A0301',
    borderRadius: 25,
    opacity: 0.8,
  },
  beanGrooveRight: {
    position: 'absolute',
    right: -10,
    top: -5,
    bottom: -5,
    width: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#0A0301',
    borderRadius: 25,
    opacity: 0.6,
    transform: [{ scaleY: -1 }]
  },
  beanShadow: {
    position: 'absolute',
    bottom: -15,
    width: 24,
    height: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    filter: 'blur(5px)' as any,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24, // Fix height to prevent jumping when text changes
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: '#E6D0B8',
    letterSpacing: 1,
    minWidth: 100,
    textAlign: 'center',
  },
  branding: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.6,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E6CBB3',
    marginBottom: 4,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E6CBB3',
    letterSpacing: 0.5,
  },
});
