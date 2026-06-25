import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ExploreScreen } from '../screens/main/ExploreScreen';
import { EventsScreen } from '../screens/main/EventsScreen';
import { LovedCafesScreen } from '../screens/main/LovedCafesScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { CafeDetailsScreen } from '../screens/main/CafeDetailsScreen';
import { EventSuccessScreen } from '../screens/main/EventSuccessScreen';
import { AttendanceScannerScreen } from '../screens/owner/AttendanceScannerScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { MeetupChatScreen } from '../screens/main/MeetupChatScreen';
import { MeetupOrderScreen } from '../screens/meetup/MeetupOrderScreen';
import { MyMeetupsScreen } from '../screens/main/MyMeetupsScreen';
import { EventDetailsScreen } from '../screens/main/EventDetailsScreen';
import { MyTicketsScreen } from '../screens/main/MyTicketsScreen';
import { TermsAndConditionsScreen } from '../screens/main/TermsAndConditionsScreen';
import { PrivacyPolicyScreen } from '../screens/main/PrivacyPolicyScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import type { MainStackParamList, MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Loved" component={LovedCafesScreen} />
    </Tab.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen
        name="CafeDetails"
        component={CafeDetailsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="EventSuccess" component={EventSuccessScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="AttendanceScanner" component={AttendanceScannerScreen} />
      <Stack.Screen
        name="MyMeetups"
        component={MyMeetupsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="MeetupChat"
        component={MeetupChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MeetupOrder"
        component={MeetupOrderScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TermsAndConditions"
        component={TermsAndConditionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
