import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { clearSecureToken, getSecureToken, saveSecureToken } from './secureStorage.service';

const KEYS = {
  TOKEN: '@caffelino/token',
  USER: '@caffelino/user',
  ONBOARDING: '@caffelino/onboarding_complete',
  LOCATION: '@caffelino/location_granted',
  THEME: '@caffelino/theme',
  PENDING_PHONE: '@caffelino/pending_phone',
} as const;

export async function getToken(): Promise<string | null> {
  const secure = await getSecureToken();
  if (secure) return secure;
  return AsyncStorage.getItem(KEYS.TOKEN);
}

export async function setToken(token: string): Promise<void> {
  await saveSecureToken(token);
  await AsyncStorage.setItem(KEYS.TOKEN, token);
}

export async function clearToken(): Promise<void> {
  await clearSecureToken();
  await AsyncStorage.removeItem(KEYS.TOKEN);
}

export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function setUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

export async function isOnboardingComplete(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.ONBOARDING)) === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING, 'true');
}

export async function isLocationGranted(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.LOCATION)) === 'true';
}

export async function setLocationGranted(): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOCATION, 'true');
}

export async function getThemePreference(): Promise<'light' | 'dark' | 'system'> {
  const v = await AsyncStorage.getItem(KEYS.THEME);
  if (v === 'dark' || v === 'light') return v;
  return 'system';
}

export async function setThemePreference(theme: 'light' | 'dark' | 'system'): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, theme);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.TOKEN),
    AsyncStorage.removeItem(KEYS.USER),
    AsyncStorage.removeItem(KEYS.ONBOARDING),
    AsyncStorage.removeItem(KEYS.LOCATION),
    AsyncStorage.removeItem(KEYS.PENDING_PHONE),
  ]);
}
