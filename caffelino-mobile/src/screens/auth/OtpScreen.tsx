import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Alert, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OtpInput } from '../../components/ui/OtpInput';
import { Button } from '../../components/ui/Button';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatIndianE164Display } from '../../utils/phone';
import type { RootStackParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

const RESEND_SECONDS = 30;

export function OtpScreen({ navigation, route }: Props) {
  const { mobileNumber, localDigits } = route.params;
  const { palette } = useTheme();
  const { verifyPhoneOtp, resendPhoneOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSecs, setResendSecs] = useState(RESEND_SECONDS);
  const [success, setSuccess] = useState(false);
  const verifiedRef = useRef(false);
  const zoom = useSharedValue(1);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSecs]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (loading || verifiedRef.current || code.length < 6) return;
      verifiedRef.current = true;
      setLoading(true);

      try {
        const result = await verifyPhoneOtp(localDigits, code, true);
        setSuccess(true);
        zoom.value = withSpring(0.92);

        setTimeout(() => {
          if (result.isNewUser) {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'OnboardingName',
                  params: {
                    mobileNumber,
                    countryCode: route.params.countryCode,
                  },
                },
              ],
            });
          }
          // Returning users with completed profile: RootNavigator opens Home automatically
        }, 400);
      } catch (e) {
        verifiedRef.current = false;
        Alert.alert('Verification failed', (e as Error).message);
        setOtp('');
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      verifyPhoneOtp,
      localDigits,
      mobileNumber,
      navigation,
      route.params.countryCode,
      zoom,
    ],
  );

  // Effect removed since we don't have demo OTP anymore

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.value }],
    opacity: Math.max(zoom.value, 0.85),
  }));

  const handleResend = async () => {
    if (resendSecs > 0 || resending) return;
    setResending(true);
    try {
      await resendPhoneOtp();
      setResendSecs(RESEND_SECONDS);
      verifiedRef.current = false;
      setOtp('');
    } finally {
      setResending(false);
    }
  };

  return (
    <Animated.View
      style={[styles.container, zoomStyle, { backgroundColor: palette.cream }]}
    >
      <Text style={[styles.title, { color: palette.espresso }]}>Enter Verification Code</Text>
      <Text style={[styles.sub, { color: palette.textMuted }]}>
        Sent to {formatIndianE164Display(mobileNumber)}
      </Text>



      {loading && !success ? (
        <CoffeeLoader message="Verifying…" />
      ) : success ? (
        <Animated.Text entering={FadeIn} style={styles.tick}>
          ✓
        </Animated.Text>
      ) : (
        <>
          <OtpInput value={otp} onChange={setOtp} onComplete={handleVerify} />
          <Button
            label="Verify & Continue"
            onPress={() => handleVerify(otp)}
            loading={loading}
            style={styles.verifyBtn}
          />
        </>
      )}

      <Pressable onPress={handleResend} disabled={resendSecs > 0 || resending || loading}>
        <Text
          style={[
            styles.resend,
            { color: resendSecs > 0 ? palette.textMuted : palette.coffeeBrown },
          ]}
        >
          {resendSecs > 0 ? `Resend in ${resendSecs}s` : 'Resend OTP'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { ...typography.h1, marginBottom: spacing.sm, textAlign: 'center' },
  sub: { ...typography.bodySmall, marginBottom: spacing.md, textAlign: 'center' },

  verifyBtn: { marginTop: spacing.lg, alignSelf: 'stretch' },
  resend: { marginTop: spacing.xl, fontSize: 14, fontWeight: '600' },
  tick: { fontSize: 64, color: '#4CAF50', fontWeight: '700' },
});
