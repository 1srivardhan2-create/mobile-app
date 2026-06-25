import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const PARTICLES = Array.from({ length: 15 }).map((_, i) => {
  const isLeaf = i % 4 === 0;
  const isDust = i % 3 === 0 && !isLeaf;
  const size = isDust ? 4 + Math.random() * 4 : 12 + Math.random() * 12;
  return {
    id: i,
    x: Math.random() * width,
    y: Math.random() * height + height,
    size,
    duration: 15000 + Math.random() * 20000,
    delay: Math.random() * 10000,
    type: isLeaf ? 'leaf' : isDust ? 'dust' : 'bean',
    opacity: isDust ? 0.15 : 0.08,
  };
});

function Particle({ item }: { item: typeof PARTICLES[0] }) {
  const translateY = useSharedValue(item.y);
  const rotate = useSharedValue(0);
  const translateX = useSharedValue(item.x);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-100, { duration: item.duration, easing: Easing.linear }),
      -1,
      false
    );
    rotate.value = withRepeat(
      withTiming(Math.random() > 0.5 ? 360 : -360, { duration: item.duration * 0.8, easing: Easing.linear }),
      -1,
      false
    );
    translateX.value = withRepeat(
      withSequence(
        withTiming(item.x + 30, { duration: item.duration * 0.3, easing: Easing.inOut(Easing.ease) }),
        withTiming(item.x - 30, { duration: item.duration * 0.3, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [item, translateY, rotate, translateX]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: item.opacity,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (item.type === 'dust') {
    return (
      <Animated.View
        style={[
          style,
          {
            width: item.size,
            height: item.size,
            borderRadius: item.size / 2,
            backgroundColor: '#6F4E37',
          },
        ]}
      />
    );
  }

  return (
    <Animated.Text style={[style, { fontSize: item.size }]}>
      {item.type === 'leaf' ? '🌿' : '🫘'}
    </Animated.Text>
  );
}

export function FloatingParticles() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p) => (
        <Particle key={p.id} item={p} />
      ))}
    </View>
  );
}
