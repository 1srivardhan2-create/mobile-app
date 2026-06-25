import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCafes } from '../../hooks/useCafes';
import { meetupsApi } from '../../api';
import { spacing, typography } from '../../theme';
import type { Cafe, Meetup } from '../../types';
import type { DateOption, TimeSlot } from '../../utils/meetupTime';
import { DateTimeStep } from './DateTimeStep';
import { CafeSelectStep } from './CafeSelectStep';
import { MeetupSuccessStep } from './MeetupSuccessStep';
import { CoffeeLoader } from '../ui/CoffeeLoader';

type Step = 'datetime' | 'cafe' | 'creating' | 'success';

interface CreateMeetupFlowProps {
  visible: boolean;
  onClose: () => void;
  onEnterChat: (meetupId: string, meetupCode: string) => void;
  onMeetupCreated?: (meetup: Meetup) => void;
}

export function CreateMeetupFlow({ visible, onClose, onEnterChat, onMeetupCreated }: CreateMeetupFlowProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { cafes, loading } = useCafes();

  const [step, setStep] = useState<Step>('datetime');
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('datetime');
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedCafe(null);
    setMeetup(null);
    setCreating(false);
    setError(null);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!user?.id || !selectedCafe || !selectedDate || !selectedSlot) return;
    setCreating(true);
    setStep('creating');
    setError(null);
    try {
      const title = `Coffee Meetup @ ${selectedCafe.Name}`;
      const { meetup: created } = await meetupsApi.create({
        title,
        organizerId: user.id,
        organizerName: user.name,
        organizerAvatarId: user.avatarId,
        date: selectedDate.iso,
        time: selectedSlot.label,
      });

      await meetupsApi.selectCafe({
        meetupId: created._id,
        userId: user.id,
        cafe: {
          cafeId: selectedCafe._id,
          cafeName: selectedCafe.Name,
          cafeImage: selectedCafe.Cafe_photos?.[0] || selectedCafe.profilePicture,
          location: selectedCafe.Cafe_Address,
        },
      });

      await meetupsApi.sendMessage({
        meetupId: created._id,
        userId: user.id,
        userName: user.name,
        message: `☕ Meetup created! Share code ${created.meetupCode} with friends.`,
        type: 'system',
      });

      let fullMeetup: Meetup = {
        ...created,
        date: selectedDate.iso,
        time: selectedSlot.label,
        organizerId: String(user.id),
        selectedCafe: {
          cafeId: selectedCafe._id,
          cafeName: selectedCafe.Name,
          cafeImage: selectedCafe.Cafe_photos?.[0] || selectedCafe.profilePicture,
          location: selectedCafe.Cafe_Address,
        },
      };

      try {
        const detail = await meetupsApi.getById(created._id);
        if (detail.meetup) {
          fullMeetup = {
            ...detail.meetup,
            date: selectedDate.iso,
            time: selectedSlot.label,
          };
        }
      } catch {
        /* use local enriched */
      }

      onMeetupCreated?.(fullMeetup);
      setMeetup(fullMeetup);
      setStep('success');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const stepTitle =
    step === 'datetime' ? 'When?' : step === 'cafe' ? 'Pick a Café' : step === 'success' ? 'All Set!' : '';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          {step !== 'success' && step !== 'creating' ? (
            <Pressable onPress={step === 'datetime' ? handleClose : () => setStep('datetime')} hitSlop={12}>
              <Ionicons
                name={step === 'datetime' ? 'close' : 'arrow-back'}
                size={28}
                color={palette.espresso}
              />
            </Pressable>
          ) : (
            <View style={{ width: 28 }} />
          )}
          <Text style={[styles.topTitle, { color: palette.espresso }]}>{stepTitle}</Text>
          <View style={styles.steps}>
            {(['datetime', 'cafe', 'success'] as const).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      step === s || (step === 'creating' && s === 'cafe')
                        ? palette.coffeeBrown
                        : palette.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {error && !creating && (
          <Text style={[styles.error, { color: palette.error }]}>{error}</Text>
        )}

        {step === 'datetime' && (
          <DateTimeStep
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedSlot(null);
            }}
            onSelectSlot={setSelectedSlot}
            onContinue={() => setStep('cafe')}
          />
        )}

        {step === 'cafe' && (
          <CafeSelectStep
            cafes={cafes}
            loading={loading}
            selectedCafe={selectedCafe}
            onSelect={setSelectedCafe}
            onContinue={handleCreate}
            creating={creating}
          />
        )}

        {step === 'creating' && (
          <View style={{ flex: 1 }}>
            <CoffeeLoader message="Preparing your meetup experience..." />
          </View>
        )}

        {step === 'success' && meetup && (
          <MeetupSuccessStep
            meetup={{ ...meetup, date: selectedDate?.iso, time: selectedSlot?.label }}
            cafeName={selectedCafe?.Name ?? '—'}
            onEnterChat={() => {
              onEnterChat(meetup._id, meetup.meetupCode);
              handleClose();
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { ...typography.h3, flex: 1, textAlign: 'center' },
  steps: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  error: { textAlign: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: 16 },
});
