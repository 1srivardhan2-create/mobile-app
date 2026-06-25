import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { IllustratedAvatar } from '../onboarding/IllustratedAvatar';
import { getAvatarById } from '../../constants/avatars';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';
import type { Feedback } from '../../types';

interface FloatingFeedbackCardProps {
  feedback: Feedback;
  seed: number;
}

export function FloatingFeedbackCard({ feedback, seed }: FloatingFeedbackCardProps) {
  const { palette } = useTheme();
  const avatar = getAvatarById(feedback.profileImage);
  const driftX = useSharedValue(0);
  const driftY = useSharedValue(0);

  useEffect(() => {
    const duration = 4000 + (seed % 3) * 1000;
    driftX.value = withRepeat(
      withSequence(
        withTiming(8 + (seed % 5), { duration }),
        withTiming(-6 - (seed % 4), { duration }),
      ),
      -1,
      true,
    );
    driftY.value = withRepeat(
      withSequence(
        withTiming(-10 - (seed % 3), { duration: duration * 1.1 }),
        withTiming(6, { duration: duration * 1.1 }),
      ),
      -1,
      true,
    );
  }, [seed, driftX, driftY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: driftX.value }, { translateY: driftY.value }],
  }));

  const stars = '⭐'.repeat(Math.min(5, Math.max(1, feedback.rating)));

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[
        styles.card,
        floatStyle,
        {
          backgroundColor: palette.glass,
          borderColor: palette.glassBorder,
        },
      ]}
    >
      <View style={styles.avatar}>
        <IllustratedAvatar avatar={avatar} size={44} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: palette.espresso }]}>{feedback.username}</Text>
        <Text style={styles.stars}>{stars}</Text>
        <Text style={[styles.comment, { color: palette.textSecondary }]} numberOfLines={3}>
          {feedback.comment}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    maxWidth: 320,
    alignItems: 'center',
  },
  avatar: {
    marginRight: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  stars: { fontSize: 10, marginVertical: 2 },
  comment: { fontSize: 13, lineHeight: 18 },
});
