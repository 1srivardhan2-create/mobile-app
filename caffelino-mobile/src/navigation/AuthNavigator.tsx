import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { MobileNumberScreen } from '../screens/auth/MobileNumberScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { OnboardingNameScreen } from '../screens/auth/onboarding/OnboardingNameScreen';
import { OnboardingGenderScreen } from '../screens/auth/onboarding/OnboardingGenderScreen';
import { OnboardingAvatarScreen } from '../screens/auth/onboarding/OnboardingAvatarScreen';
import { OnboardingReadyScreen } from '../screens/auth/onboarding/OnboardingReadyScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AuthNavigator({
  initialRoute = 'Splash',
}: {
  initialRoute?: keyof RootStackParamList;
}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F5E6D3' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="MobileNumber" component={MobileNumberScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
      <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen} />
      <Stack.Screen name="OnboardingAvatar" component={OnboardingAvatarScreen} />
      <Stack.Screen name="OnboardingReady" component={OnboardingReadyScreen} />
    </Stack.Navigator>
  );
}
