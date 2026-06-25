import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing, typography } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MeetupActionCardsProps {
  onCreatePress: () => void;
  onJoinPress: () => void;
}

function ActionCard({
  title,
  subtitle,
  icon,
  variant,
  onPress,
  delay,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'create' | 'join';
  onPress: () => void;
  delay: number;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isCreate = variant === 'create';

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.cardWrap, animatedStyle]}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        style={[styles.card, shadows.card]}
      >
        {isCreate ? (
          <LinearGradient
            colors={[palette.darkCoffee, palette.coffeeBrown, '#8B6914']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.iconCircleLight}>
              <Ionicons name={icon} size={22} color={palette.darkCoffee} />
            </View>
            <Text style={styles.cardTitleLight}>{title}</Text>
            <Text style={styles.cardSubLight}>{subtitle}</Text>
            <View style={styles.arrowLight}>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.joinInner, { backgroundColor: palette.white, borderColor: palette.glassBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.cream }]}>
              <Ionicons name={icon} size={22} color={palette.coffeeBrown} />
            </View>
            <Text style={[styles.cardTitle, { color: palette.espresso }]}>{title}</Text>
            <Text style={[styles.cardSub, { color: palette.textMuted }]}>{subtitle}</Text>
            <View style={[styles.arrow, { backgroundColor: palette.goldAccent }]}>
              <Ionicons name="arrow-forward" size={16} color={palette.espresso} />
            </View>
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export function MeetupActionCards({ onCreatePress, onJoinPress }: MeetupActionCardsProps) {
  const { palette } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: palette.espresso }]}>Coffee Social</Text>
      <View style={styles.row}>
        <ActionCard
          title="Create Meetup"
          subtitle="Start a coffee meetup"
          icon="add-circle"
          variant="create"
          onPress={onCreatePress}
          delay={80}
        />
        <ActionCard
          title="Join Meetup"
          subtitle="Enter a friend’s code"
          icon="people"
          variant="join"
          onPress={onJoinPress}
          delay={160}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 148,
  },
  gradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    minHeight: 148,
  },
  joinInner: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    justifyContent: 'space-between',
    minHeight: 148,
  },
  iconCircleLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleLight: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  cardSubLight: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  arrowLight: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  arrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
