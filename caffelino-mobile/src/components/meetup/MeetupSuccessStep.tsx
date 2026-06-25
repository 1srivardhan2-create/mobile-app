import React, { useEffect } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme';
import type { Meetup } from '../../types';

interface MeetupSuccessStepProps {
  meetup: Meetup;
  cafeName: string;
  onEnterChat: () => void;
}

export function MeetupSuccessStep({ meetup, cafeName, onEnterChat }: MeetupSuccessStepProps) {
  const { palette } = useTheme();
  const fill = useSharedValue(0);
  const steam = useSharedValue(0);
  const codeOpacity = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(1, { duration: 1200 });
    steam.value = withDelay(800, withTiming(1, { duration: 600 }));
    codeOpacity.value = withDelay(1400, withSpring(1, { damping: 12 }));
  }, [fill, steam, codeOpacity]);

  const cupFill = useAnimatedStyle(() => ({
    height: `${fill.value * 55}%`,
  }));
  const steamStyle = useAnimatedStyle(() => ({
    opacity: steam.value,
    transform: [{ translateY: -steam.value * 12 }],
  }));
  const codeStyle = useAnimatedStyle(() => ({
    opacity: codeOpacity.value,
    transform: [{ scale: 0.8 + codeOpacity.value * 0.2 }],
  }));

  const copyCode = () => {
    Alert.alert('Meetup Code', meetup.meetupCode, [{ text: 'OK' }]);
  };

  const shareMeetup = async () => {
    await Share.share({
      message: `Join my Caffélino meetup! Code: ${meetup.meetupCode}\n☕ ${meetup.title}`,
    });
  };

  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.animArea}>
        <Text style={styles.confetti}>🎊 ✨ 🎉</Text>
        <View style={styles.cupWrap}>
          <Text style={styles.cupEmoji}>☕</Text>
          <View style={styles.cupLiquid}>
            <Animated.View style={[styles.liquid, cupFill]}>
              <LinearGradient colors={[palette.coffeeBrown, palette.darkCoffee]} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.steam, steamStyle]}>~ ~ ~</Animated.Text>
        </View>
        <Animated.View style={codeStyle}>
          <Text style={[styles.created, { color: palette.espresso }]}>☕ Meetup Created</Text>
          <Text style={[styles.codeLabel, { color: palette.textMuted }]}>Meetup Code</Text>
          <Text style={[styles.code, { color: palette.coffeeBrown }]}>{meetup.meetupCode}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(1600).springify()} style={[styles.details, { backgroundColor: palette.white }]}>
        <Row label="Café" value={cafeName} palette={palette} />
        <Row label="Date" value={meetup.date ?? '—'} palette={palette} />
        <Row label="Time" value={meetup.time ?? '—'} palette={palette} />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(1800)} style={styles.actions}>
        <ActionBtn icon="copy-outline" label="Copy Code" onPress={copyCode} palette={palette} />
        <ActionBtn icon="share-social-outline" label="Share Meetup" onPress={shareMeetup} palette={palette} />
        <Pressable onPress={onEnterChat} style={[styles.chatBtn, { backgroundColor: palette.coffeeBrown }]}>
          <Text style={styles.chatBtnText}>Enter Chat</Text>
          <Ionicons name="chatbubbles" size={20} color="#FFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Row({ label, value, palette }: { label: string; value: string; palette: { textMuted: string; espresso: string } }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: palette.espresso }]}>{value}</Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  palette: { cream: string; espresso: string };
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionBtn, { backgroundColor: palette.cream }]}>
      <Ionicons name={icon} size={18} color={palette.espresso} />
      <Text style={[styles.actionText, { color: palette.espresso }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  animArea: { alignItems: 'center', marginBottom: spacing.lg },
  confetti: { fontSize: 22, marginBottom: spacing.sm },
  cupWrap: { alignItems: 'center', height: 100, marginBottom: spacing.md },
  cupEmoji: { fontSize: 64, zIndex: 2 },
  cupLiquid: {
    position: 'absolute',
    bottom: 8,
    width: 40,
    height: 50,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  liquid: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 4 },
  steam: { position: 'absolute', top: 0, fontSize: 16, color: '#AAA', letterSpacing: 4 },
  created: { ...typography.h2, textAlign: 'center' },
  codeLabel: { textAlign: 'center', marginTop: spacing.md, fontSize: 13 },
  code: { fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: 6, marginTop: 4 },
  details: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  actions: { gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  actionText: { fontWeight: '600' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  chatBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
