import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { CoffeeLoader } from '../components/ui/CoffeeLoader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';

export function RootNavigator() {
  const { user, isLoading, isAuthenticated, hasCompletedOnboarding } = useAuth();
  const { palette } = useTheme();

  if (isLoading) {
    return <CoffeeLoader message="Starting Caffélino..." />;
  }

  const showMain = isAuthenticated && hasCompletedOnboarding;

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: palette.coffeeBrown,
          background: palette.cream,
          card: palette.white,
          text: palette.espresso,
          border: palette.border,
          notification: palette.goldAccent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      {showMain ? (
        user?.role === 'cafe_owner' ? (
          <OwnerDashboardScreen />
        ) : (
          <MainNavigator />
        )
      ) : (
        <AuthNavigator
          initialRoute={
            isAuthenticated && !hasCompletedOnboarding
              ? 'OnboardingName'
              : 'Splash'
          }
        />
      )}
    </NavigationContainer>
  );
}
