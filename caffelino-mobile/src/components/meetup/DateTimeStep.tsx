import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
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
import {
  generateTimeSlots,
  getUpcomingDates,
  type DateOption,
  type TimeSlot,
} from '../../utils/meetupTime';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DateTimeStepProps {
  selectedDate: DateOption | null;
  selectedSlot: TimeSlot | null;
  onSelectDate: (d: DateOption) => void;
  onSelectSlot: (s: TimeSlot) => void;
  onContinue: () => void;
}

function DateCard({
  option,
  selected,
  onPress,
}: {
  option: DateOption;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View style={[styles.dateInner, selected && styles.dateInnerSelected]}>
      <Text style={[styles.dateLabel, { color: selected ? '#FFF' : palette.textMuted }]}>
        {option.label}
      </Text>
      <Text style={[styles.dateNum, { color: selected ? '#FFF' : palette.espresso }]}>
        {option.dayNum}
      </Text>
      <Text style={[styles.dateMonth, { color: selected ? 'rgba(255,255,255,0.85)' : palette.latteBrown }]}>
        {option.monthShort}
      </Text>
      {selected && (
        <View style={styles.beans}>
          <Text style={styles.bean}>🫘</Text>
          <Text style={[styles.bean, styles.bean2]}>🫘</Text>
        </View>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(1.05, { damping: 12, stiffness: 180 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 200 });
        }, 300);
        onPress();
      }}
      style={[styles.dateCardWrap, anim, selected && shadows.soft]}
    >
      {selected ? (
        <LinearGradient
          colors={[palette.darkCoffee, palette.coffeeBrown, palette.goldAccent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dateCard}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.dateCard, { backgroundColor: '#F0EBE6' }]}>{content}</View>
      )}
    </AnimatedPressable>
  );
}

function TimePill({
  slot,
  selected,
  onPress,
}: {
  slot: TimeSlot;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(0.94, { damping: 10 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 12 });
        }, 150);
        onPress();
      }}
      style={[
        styles.timePill,
        anim,
        {
          backgroundColor: selected ? palette.coffeeBrown : palette.white,
          borderColor: selected ? palette.coffeeBrown : palette.border,
        },
        selected && shadows.soft,
      ]}
    >
      <Text style={[styles.timeText, { color: selected ? '#FFF' : palette.espresso }]}>
        {slot.label}
      </Text>
    </AnimatedPressable>
  );
}

export function DateTimeStep({
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onContinue,
}: DateTimeStepProps) {
  const { palette } = useTheme();
  const dates = useMemo(() => getUpcomingDates(3), []);
  const slots = useMemo(
    () => (selectedDate ? generateTimeSlots(selectedDate.date) : []),
    [selectedDate],
  );
  const canContinue = Boolean(selectedDate && selectedSlot);
  const fill = useSharedValue(canContinue ? 1 : 0);

  React.useEffect(() => {
    fill.value = withSpring(canContinue ? 1 : 0, { damping: 14 });
  }, [canContinue, fill]);

  const btnAnim = useAnimatedStyle(() => ({
    opacity: 0.4 + fill.value * 0.6,
    transform: [{ scale: 0.96 + fill.value * 0.04 }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrap}>
      <View style={[styles.card, shadows.card, { backgroundColor: palette.white }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>☕</Text>
          <View>
            <Text style={[styles.title, { color: palette.espresso }]}>Pick a Date</Text>
            <Text style={[styles.sub, { color: palette.textMuted }]}>Choose when to meet</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          {dates.map((d) => (
            <DateCard
              key={d.key}
              option={d}
              selected={selectedDate?.key === d.key}
              onPress={() => onSelectDate(d)}
            />
          ))}
        </View>

        {selectedDate && (
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <Text style={[styles.sectionTitle, { color: palette.espresso }]}>Pick a Time</Text>
            <Text style={[styles.hours, { color: palette.textMuted }]}>10:00 AM — 10:00 PM</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeScroll}
            >
              {slots.map((slot) => (
                <TimePill
                  key={slot.id}
                  slot={slot}
                  selected={selectedSlot?.id === slot.id}
                  onPress={() => onSelectSlot(slot)}
                />
              ))}
            </ScrollView>
            {slots.length === 0 && (
              <Text style={[styles.empty, { color: palette.textMuted }]}>
                No slots left today. Pick tomorrow.
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      <AnimatedPressable
        disabled={!canContinue}
        onPress={onContinue}
        style={[styles.continueBtn, btnAnim, { opacity: canContinue ? 1 : 0.45 }]}
      >
        <LinearGradient
          colors={
            canContinue
              ? [palette.darkCoffee, palette.coffeeBrown, palette.goldAccent]
              : ['#BDBDBD', '#9E9E9E']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueGradient}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg },
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    flex: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  headerEmoji: { fontSize: 36 },
  title: { ...typography.h2, fontSize: 22 },
  sub: { ...typography.bodySmall, marginTop: 2 },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  dateCardWrap: { flex: 1 },
  dateCard: { borderRadius: radius.lg, minHeight: 120, overflow: 'hidden' },
  dateInner: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  dateInnerSelected: {},
  dateLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dateNum: { fontSize: 32, fontWeight: '900', marginVertical: 4 },
  dateMonth: { fontSize: 11, fontWeight: '600' },
  beans: { position: 'absolute', top: 8, right: 8 },
  bean: { fontSize: 10, opacity: 0.7 },
  bean2: { marginTop: -4, marginLeft: 6 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.xs },
  hours: { fontSize: 12, marginBottom: spacing.md },
  timeScroll: { gap: spacing.sm, paddingBottom: spacing.sm },
  timePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  timeText: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', padding: spacing.lg },
  continueBtn: { marginTop: spacing.lg, borderRadius: radius.lg, overflow: 'hidden' },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
  },
  continueText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
