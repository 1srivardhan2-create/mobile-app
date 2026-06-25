import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import {
  formatIndianMobile,
  isValidIndianMobile,
  parseIndianMobile,
  toIndianE164,
} from '../../utils/phone';
import type { RootStackParamList } from '../../types';
import { spacing, radius, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MobileNumber'>;

const COUNTRY_CODE = '+91';

export function MobileNumberScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { sendPhoneOtp } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [digits, setDigits] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayValue = formatIndianMobile(digits);

  const handleChange = (text: string) => {
    setDigits(parseIndianMobile(text));
  };

  const handleContinue = async () => {
    if (!isValidIndianMobile(digits)) {
      Alert.alert(
        'Invalid number',
        'Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).',
      );
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOtp(digits);
      navigation.navigate('Otp', {
        mobileNumber: toIndianE164(digits),
        localDigits: digits,
        countryCode: COUNTRY_CODE,
        isNewUser: true, // Will be resolved during verification
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.cream }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.inner}>
        <Animated.View entering={FadeInRight.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: palette.espresso }]}>
            Enter Your Mobile Number
          </Text>
          <Text style={[styles.hint, { color: palette.textMuted }]}>
            We'll send you an OTP to verify your number
          </Text>
        </Animated.View>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.phoneRow,
            {
              borderColor: focused ? palette.goldAccent : palette.border,
              backgroundColor: palette.white,
            },
          ]}
        >
          <View style={[styles.prefix, { borderRightColor: palette.border }]}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={[styles.prefixCode, { color: palette.espresso }]}>+91</Text>
          </View>

          <TextInput
            ref={inputRef}
            style={[styles.input, { color: palette.espresso }]}
            placeholder="98765 43210"
            placeholderTextColor={palette.textMuted}
            value={displayValue}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            inputMode="numeric"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            maxLength={11}
            autoFocus
            showSoftInputOnFocus
          />
        </Pressable>

        <Button label="Continue →" onPress={handleContinue} loading={loading} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.sm },
  hint: { ...typography.bodySmall },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.lg,
    minHeight: 60,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    gap: 6,
  },
  flag: { fontSize: 22 },
  prefixCode: { fontSize: 18, fontWeight: '700' },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'android' ? spacing.sm : spacing.md,
    minHeight: 56,
  },
});
