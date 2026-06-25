import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { OnboardingBackground } from '../../../components/onboarding/OnboardingBackground';
import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { useTheme } from '../../../context/ThemeContext';
import type { RootStackParamList } from '../../../types';
import { spacing, radius, typography, shadows } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingName'>;

export function OnboardingNameScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();
  const mobileNumber = route.params?.mobileNumber ?? user?.mobileNumber ?? '';
  const countryCode = route.params?.countryCode ?? '+91';
  const [fullName, setFullName] = useState(user?.name ?? '');

  const handleContinue = () => {
    if (!fullName.trim()) return;
    navigation.navigate('OnboardingGender', {
      mobileNumber,
      countryCode,
      fullName: fullName.trim(),
    });
  };

  return (
    <OnboardingBackground>
      <KeyboardAvoidingView
        style={[styles.flex, { paddingTop: insets.top + spacing.md }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <OnboardingProgress step={1} />

          <Animated.Text
            entering={FadeInDown.duration(500).delay(100)}
            style={[styles.title, { color: palette.espresso }]}
          >
            Welcome to Caffélino
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(500).delay(200)}
            style={[styles.subtitle, { color: palette.textSecondary }]}
          >
            Find cafés, friends and meaningful conversations.
          </Animated.Text>

          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={[styles.inputCard, shadows.card, { backgroundColor: palette.white }]}
          >
            <Text style={[styles.label, { color: palette.textMuted }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { color: palette.espresso }]}
              placeholder="Your name"
              placeholderTextColor={palette.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.duration(500).delay(450)} style={styles.footer}>
          <Button label="Continue" onPress={handleContinue} disabled={!fullName.trim()} />
        </Animated.View>
      </KeyboardAvoidingView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: spacing.lg },
  content: { flex: 1 },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, lineHeight: 24, marginBottom: spacing.xl },
  inputCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  label: { ...typography.caption, marginBottom: spacing.sm },
  input: { fontSize: 20, fontWeight: '600', paddingVertical: spacing.sm },
  footer: { paddingBottom: spacing.xl },
});
