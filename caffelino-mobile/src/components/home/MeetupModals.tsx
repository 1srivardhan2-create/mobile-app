import React from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme';

interface MeetupModalsProps {
  showCreate: boolean;
  showJoin: boolean;
  title: string;
  joinCode: string;
  creating: boolean;
  joining: boolean;
  onTitleChange: (v: string) => void;
  onJoinCodeChange: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onCloseCreate: () => void;
  onCloseJoin: () => void;
}

export function MeetupModals({
  showCreate,
  showJoin,
  title,
  joinCode,
  creating,
  joining,
  onTitleChange,
  onJoinCodeChange,
  onCreate,
  onJoin,
  onCloseCreate,
  onCloseJoin,
}: MeetupModalsProps) {
  const { palette } = useTheme();

  return (
    <>
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: palette.cream }]}>
            <Text style={[styles.modalTitle, { color: palette.espresso }]}>Create Meetup</Text>
            <Text style={[styles.modalSub, { color: palette.textMuted }]}>
              Plan a coffee hangout and invite friends with a share code.
            </Text>
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.espresso }]}
              placeholder="e.g. Sunday Brew Club"
              placeholderTextColor={palette.textMuted}
              value={title}
              onChangeText={onTitleChange}
            />
            <Button label="Create Meetup" onPress={onCreate} loading={creating} />
            <Button label="Cancel" variant="ghost" onPress={onCloseCreate} />
          </View>
        </View>
      </Modal>

      <Modal visible={showJoin} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: palette.cream }]}>
            <Text style={[styles.modalTitle, { color: palette.espresso }]}>Join Meetup</Text>
            <Text style={[styles.modalSub, { color: palette.textMuted }]}>
              Enter the code shared by your meetup host.
            </Text>
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.espresso }]}
              placeholder="ABC123"
              placeholderTextColor={palette.textMuted}
              value={joinCode}
              onChangeText={onJoinCodeChange}
              autoCapitalize="characters"
            />
            <Button label="Join Meetup" onPress={onJoin} loading={joining} />
            <Button label="Cancel" variant="ghost" onPress={onCloseJoin} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(43, 27, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  modal: {
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalTitle: { ...typography.h2, marginBottom: spacing.xs },
  modalSub: { ...typography.bodySmall, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
  },
});
