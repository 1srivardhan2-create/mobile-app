import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { FloatingFeedbackCard } from '../../components/feedback/FloatingFeedbackCard';
import { Button } from '../../components/ui/Button';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { feedbackApi } from '../../api';
import { getAvatarById } from '../../constants/avatars';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFeedbacks } from '../../hooks/useFeedbacks';
import type { MainTabParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Loved'>;

export function LovedByUsersScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { feedbacks, loading, refetch } = useFeedbacks();
  const [showSubmit, setShowSubmit] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (comment.trim().length < 10) {
      Alert.alert('Too short', 'Feedback must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const avatar = getAvatarById(user.avatarId);
      await feedbackApi.create({
        userId: user.id,
        username: user.username || user.name,
        profileImage: user.avatarId,
        comment: comment.trim(),
        rating,
      });
      setShowSubmit(false);
      setComment('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      refetch();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.espresso, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: palette.cream }]}>Loved By Users</Text>
      <Text style={[styles.sub, { color: palette.latteBrown }]}>
        Real experiences from the community
      </Text>

      <Pressable
        onPress={() => setShowSubmit(true)}
        style={[styles.addBtn, { backgroundColor: palette.goldAccent }]}
      >
        <Text style={styles.addText}>+ Share Experience</Text>
      </Pressable>

      {showSuccess && (
        <View style={styles.success}>
          <Text style={styles.splash}>☕💦</Text>
          <Text style={{ color: palette.cream, fontWeight: '600' }}>
            Thanks for sharing ☕
          </Text>
        </View>
      )}

      {loading ? (
        <CoffeeLoader message="Loading love..." />
      ) : feedbacks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyChar}>🧋</Text>
          <Text style={{ color: palette.cream, textAlign: 'center' }}>
            Be the first to share your experience ☕
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.feedList} showsVerticalScrollIndicator={false}>
          {feedbacks.map((fb, i) => (
            <FloatingFeedbackCard key={fb._id} feedback={fb} seed={i} />
          ))}
        </ScrollView>
      )}

      <Modal visible={showSubmit} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: palette.cream }]}>
            <Text style={[styles.modalTitle, { color: palette.espresso }]}>Your Feedback</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Text style={{ fontSize: 28, opacity: n <= rating ? 1 : 0.3 }}>⭐</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.espresso }]}
              multiline
              placeholder="Tell us about your café experience..."
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Button label="Submit" onPress={handleSubmit} loading={submitting} />
            <Button label="Cancel" variant="ghost" onPress={() => setShowSubmit(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  title: { ...typography.h1, marginTop: spacing.md },
  sub: { marginBottom: spacing.md },
  addBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  addText: { fontWeight: '700', color: '#2B1B17' },
  feedList: { paddingBottom: spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyChar: { fontSize: 72, marginBottom: spacing.md },
  success: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  splash: { fontSize: 48 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: { borderRadius: 20, padding: spacing.lg },
  modalTitle: { ...typography.h2, marginBottom: spacing.md },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
});
