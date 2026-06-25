import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { CreateMeetupFlow } from '../../components/meetup/CreateMeetupFlow';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { useTheme } from '../../context/ThemeContext';
import { useHostedMeetups } from '../../hooks/useHostedMeetups';
import { useMeetupActions } from '../../hooks/useMeetupActions';
import type { MainStackParamList, Meetup } from '../../types';
import {
  STATUS_BADGE,
  formatMeetupDate,
  formatMeetupTimeDisplay,
  getCafeNameFromMeetup,
  getMeetupDisplayStatus,
} from '../../utils/meetupDisplay';
import { radius, shadows, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'MyMeetups'>;

async function copyText(text: string): Promise<boolean> {
  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

export function MyMeetupsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { meetups, loading, refresh, registerMeetup, totalCount, deleteMeetup } = useHostedMeetups();
  const meetupActions = useMeetupActions();
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const goToChat = (meetupId: string, meetupCode: string) => {
    navigation.navigate('MeetupChat', { meetupId, meetupCode });
  };

  const handleCopyCode = async (code: string) => {
    const ok = await copyText(code);
    if (!ok) {
      await Share.share({ message: code });
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShare = async (meetup: Meetup) => {
    const link = `https://caffelino.in/join/${meetup.meetupCode}`;
    await Share.share({
      message: `Join my coffee meetup "${meetup.title}"!\nCode: ${meetup.meetupCode}\n${link}`,
      title: meetup.title,
    });
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={palette.espresso} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: palette.espresso }]}>My Meetups</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.totalLine, { color: palette.textMuted }]}>
        {totalCount} Meetup{totalCount === 1 ? '' : 's'} Created
      </Text>

      {loading && !meetups.length ? (
        <CoffeeLoader message="Loading your meetups..." />
      ) : meetups.length === 0 ? (
        <EmptyState
          palette={palette}
          onCreate={meetupActions.openCreate}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.coffeeBrown}
            />
          }
        >
          {meetups.map((meetup, i) => (
            <MeetupListCard
              key={meetup._id}
              meetup={meetup}
              index={i}
              palette={palette}
              copiedCode={copiedCode}
              onView={() => goToChat(meetup._id, meetup.meetupCode)}
              onChat={() => goToChat(meetup._id, meetup.meetupCode)}
              onCopy={() => handleCopyCode(meetup.meetupCode)}
              onShare={() => handleShare(meetup)}
              onDelete={() => {
                Alert.alert('Delete Meetup', 'Are you sure you want to remove this meetup from your history?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteMeetup(String(meetup._id)) }
                ]);
              }}
            />
          ))}
        </ScrollView>
      )}

      <CreateMeetupFlow
        visible={meetupActions.showCreate}
        onClose={meetupActions.closeCreate}
        onMeetupCreated={registerMeetup}
        onEnterChat={(id, code) => {
          meetupActions.closeCreate();
          refresh();
          goToChat(id, code);
        }}
      />
    </View>
  );
}

function EmptyState({
  palette,
  onCreate,
}: {
  palette: { espresso: string; textMuted: string; coffeeBrown: string };
  onCreate: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>☕</Text>
      <Text style={[styles.emptyTitle, { color: palette.espresso }]}>No Meetups Created Yet</Text>
      <Text style={[styles.emptySub, { color: palette.textMuted }]}>
        Create your first coffee meetup and start connecting with people.
      </Text>
      <Pressable onPress={onCreate} style={[styles.createBtn, { backgroundColor: palette.coffeeBrown }]}>
        <Text style={styles.createBtnText}>☕ Create Meetup</Text>
      </Pressable>
    </View>
  );
}

function MeetupListCard({
  meetup,
  index,
  palette,
  copiedCode,
  onView,
  onChat,
  onCopy,
  onShare,
  onDelete,
}: {
  meetup: Meetup;
  index: number;
  palette: {
    white: string;
    espresso: string;
    textMuted: string;
    coffeeBrown: string;
    border: string;
  };
  copiedCode: string | null;
  onView: () => void;
  onChat: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const displayStatus = getMeetupDisplayStatus(meetup);
  const badge = STATUS_BADGE[displayStatus];
  const memberCount = meetup.memberCount ?? meetup.members?.length ?? 0;
  const cafeName = getCafeNameFromMeetup(meetup);
  const isCopied = copiedCode === meetup.meetupCode;

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <View style={[styles.card, shadows.card, { backgroundColor: palette.white }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.meetupTitle, { color: palette.espresso }]}>
              {meetup.title} @ {cafeName}
            </Text>
            <Text style={[styles.code, { color: palette.coffeeBrown }]}>
              Code: {meetup.meetupCode}
            </Text>
          </View>
          <Pressable onPress={onDelete} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-vertical" size={20} color={palette.textMuted} />
          </Pressable>
        </View>
        
        <Text style={[styles.meta, { color: palette.textMuted }]}>
          {formatMeetupDate(meetup.date)}
        </Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>
          {formatMeetupTimeDisplay(meetup.time)}
        </Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>
          {memberCount} Member{memberCount === 1 ? '' : 's'}
        </Text>

        <View style={[styles.statusBadge, { borderColor: badge.color }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>
            {badge.emoji} {badge.label}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionBtn icon="eye-outline" label="View Meetup" onPress={onView} palette={palette} />
          <ActionBtn icon="chatbubbles-outline" label="Open Chat" onPress={onChat} palette={palette} />
          <ActionBtn
            icon={isCopied ? 'checkmark-circle' : 'copy-outline'}
            label={isCopied ? 'Code Copied' : 'Copy Code'}
            onPress={onCopy}
            palette={palette}
            highlight={isCopied}
          />
          <ActionBtn icon="share-social-outline" label="Share" onPress={onShare} palette={palette} />
        </View>
      </View>
    </Animated.View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  palette,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  palette: { cream: string; coffeeBrown: string; border: string };
  highlight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionBtn,
        {
          backgroundColor: highlight ? '#E8F5E9' : palette.cream,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={palette.coffeeBrown} />
      <Text style={[styles.actionLabel, { color: palette.coffeeBrown }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageTitle: { ...typography.h2 },
  totalLine: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: { fontSize: 72, marginBottom: spacing.lg },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptySub: { ...typography.body, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  createBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  meetupTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  code: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 13, marginBottom: 2 },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 12, fontWeight: '600' },
});
