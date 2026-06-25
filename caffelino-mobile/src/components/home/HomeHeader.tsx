import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatarButton } from '../profile/ProfileAvatarButton';
import { useTheme } from '../../context/ThemeContext';
import { buildGreeting } from '../../utils/greeting';
import { spacing, typography } from '../../theme';

interface HomeHeaderProps {
  firstName: string;
  onNotificationsPress?: () => void;
}

function CoffeeSteam() {
  const o1 = useSharedValue(0.3);
  const o2 = useSharedValue(0.2);

  useEffect(() => {
    o1.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 600 }), withTiming(0.25, { duration: 600 })),
      -1,
      true,
    );
    o2.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.15, { duration: 800 })),
      -1,
      true,
    );
  }, [o1, o2]);

  const s1 = useAnimatedStyle(() => ({ opacity: o1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: o2.value }));

  return (
    <View style={styles.steamWrap} pointerEvents="none">
      <Animated.Text style={[styles.steam, s1]}>~</Animated.Text>
      <Animated.Text style={[styles.steam, styles.steam2, s2]}>~</Animated.Text>
    </View>
  );
}

export function HomeHeader({ firstName, onNotificationsPress }: HomeHeaderProps) {
  const { palette } = useTheme();
  const greeting = useMemo(() => buildGreeting(firstName), [firstName]);

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={styles.row}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.greetingWrap}>
        <Text style={[styles.greeting, { color: palette.espresso }]} numberOfLines={2}>
          {greeting}
        </Text>
        <CoffeeSteam />
      </Animated.View>

      <View style={styles.actions}>
        <Pressable
          onPress={onNotificationsPress}
          style={[styles.bellBtn, { backgroundColor: palette.white, borderColor: palette.border }]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={palette.coffeeBrown} />
        </Pressable>
        <ProfileAvatarButton />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  greetingWrap: {
    flex: 1,
    position: 'relative',
    paddingRight: spacing.xs,
  },
  greeting: {
    ...typography.h2,
    lineHeight: 32,
  },
  steamWrap: {
    position: 'absolute',
    right: 4,
    top: 2,
    flexDirection: 'row',
    gap: 2,
  },
  steam: {
    fontSize: 14,
    color: '#A67B5B',
    fontWeight: '300',
  },
  steam2: { marginTop: -4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
