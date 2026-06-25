import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { meetupsApi } from '../../api';
import { CoffeeLoader } from '../ui/CoffeeLoader';
import { radius, spacing, typography } from '../../theme';

interface JoinMeetupFlowProps {
  visible: boolean;
  onClose: () => void;
  onJoined: (meetupId: string, meetupCode: string) => void;
}

export function JoinMeetupFlow({ visible, onClose, onJoined }: JoinMeetupFlowProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const reset = () => {
    setCode('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleJoin = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please log in to join a meetup.');
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      Alert.alert('Invalid code', 'Enter the full 6-character meetup code.');
      return;
    }
    setJoining(true);
    try {
      const { meetup } = await meetupsApi.join({
        meetupCode: trimmed,
        userId: user.id,
        name: user.name,
        avatarId: user.avatarId,
      });

      try {
        const res = await meetupsApi.sendMessage({
          meetupId: meetup._id,
          userId: 'system',
          userName: 'System',
          message: `🎉 ${user.name} joined the meetup.`,
          type: 'system',
        });
        
        const { io } = await import('socket.io-client');
        const { SOCKET_URL } = await import('../../config/env');
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socket.emit('send_message', { ...res.message, meetupId: meetup._id });
        setTimeout(() => socket.disconnect(), 1500);
      } catch (err) {
        console.log('Could not send join message', err);
      }

      setJoining(false);
      setShowSuccess(true);
      setTimeout(() => {
        handleClose();
        onJoined(meetup._id, meetup.meetupCode);
      }, 2000);
    } catch (e) {
      setJoining(false);
      Alert.alert('⚠ Invalid Meetup Code', 'Please check the code and try again.');
    }
  }, [user, code, onJoined]);

  const digits = code.padEnd(6, ' ').split('').slice(0, 6);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
        {joining ? (
          <CoffeeLoader message="Preparing your meetup experience" />
        ) : (
          <>
            <Pressable onPress={handleClose} style={styles.close}>
              <Ionicons name="close" size={28} color={palette.espresso} />
            </Pressable>

            <Animated.View entering={FadeInDown.springify()} style={styles.content}>
              <Text style={styles.emoji}>🤝</Text>
              <Text style={[styles.title, { color: palette.espresso }]}>Join Meetup</Text>
              <Text style={[styles.sub, { color: palette.textMuted }]}>
                Enter the 6-character code from your host
              </Text>

              <View style={styles.codeRow}>
                {digits.map((d, i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      {
                        borderColor: d.trim() ? palette.goldAccent : palette.border,
                        backgroundColor: palette.white,
                      },
                    ]}
                  >
                    <Text style={[styles.codeDigit, { color: palette.espresso }]}>{d.trim()}</Text>
                  </View>
                ))}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  style={styles.hiddenInput}
                  autoFocus
                  caretHidden={true}
                />
              </View>

              <Pressable
                disabled={code.length < 6 || showSuccess}
                onPress={handleJoin}
                style={[styles.joinBtn, { opacity: code.length >= 6 && !showSuccess ? 1 : 0.45 }]}
              >
                <LinearGradient
                  colors={[palette.darkCoffee, palette.coffeeBrown]}
                  style={styles.joinGradient}
                >
                  <Text style={styles.joinText}>
                    {showSuccess ? '🎉 Joined Successfully!' : 'Join Meetup'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  close: { padding: spacing.lg, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: spacing.lg, alignItems: 'center', paddingTop: spacing.xxl },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.h1, fontSize: 28 },
  sub: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigit: { fontSize: 22, fontWeight: '800' },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', color: 'transparent', backgroundColor: 'transparent', opacity: 0 },
  joinBtn: { width: '100%', borderRadius: radius.lg, overflow: 'hidden' },
  joinGradient: { paddingVertical: spacing.md + 2, alignItems: 'center', borderRadius: radius.lg },
  joinText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
