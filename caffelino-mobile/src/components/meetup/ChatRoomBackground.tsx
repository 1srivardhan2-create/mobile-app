import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const PATTERN_ITEMS = [
  { emoji: '🫘', top: '12%', left: '8%', size: 18, delay: 0 },
  { emoji: '☕', top: '28%', left: '82%', size: 24, delay: 200 },
  { emoji: '💨', top: '45%', left: '15%', size: 16, delay: 400 },
  { emoji: '🫘', top: '62%', left: '75%', size: 14, delay: 100 },
  { emoji: '☕', top: '88%', left: '40%', size: 20, delay: 300 },
  { emoji: '💨', top: '15%', left: '60%', size: 18, delay: 500 },
  { emoji: '🫘', top: '80%', left: '10%', size: 16, delay: 250 },
];

function FloatingItem({ top, left, size, delay, emoji }: (typeof PATTERN_ITEMS)[0]) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(-12, { duration: 3000 + delay }), withTiming(0, { duration: 3000 + delay })),
      -1,
      true,
    );
  }, [y, delay]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: 0.08,
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', top, left, fontSize: size }, style]}>
      {emoji}
    </Animated.Text>
  );
}

export function ChatRoomBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.pattern} />
      {PATTERN_ITEMS.map((b, i) => (
        <FloatingItem key={i} {...b} />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF3EA',
    opacity: 0.4,
  },
});
