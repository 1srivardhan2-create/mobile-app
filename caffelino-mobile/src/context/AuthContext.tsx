import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { userApi, authApi, ApiError } from '../api';
import {
  getToken,
  getUser,
  setToken,
  setUser,
  clearSession,
  isOnboardingComplete,
  isLocationGranted,
} from '../services/storage.service';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasLocationPermission: boolean;
}

interface AuthContextValue extends AuthState {
  bootstrap: () => Promise<void>;
  sendPhoneOtp: (localDigits: string) => Promise<{ isNewUser: boolean }>;
  resendPhoneOtp: () => Promise<void>;
  verifyPhoneOtp: (
    localDigits: string,
    otp: string,
    isNewUser: boolean,
  ) => Promise<{ isNewUser: boolean }>;
  finishOnboarding: (data: {
    fullName: string;
    mobileNumber: string;
    avatarId: string;
    gender: 'male' | 'female';
  }) => Promise<void>;
  completeProfile: (data: {
    fullName: string;
    username: string;
    avatarId: string;
    mobileNumber: string;
    city?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  markLocationGranted: (city?: string) => Promise<void>;
  refreshUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapApiUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name ?? '',
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    mobileNumber: raw.mobileNumber,
    avatarId: raw.avatarId,
    username: raw.username,
    gender: raw.gender,
    city: raw.city,
    role: raw.role ?? 'user',
    profileCompleted: raw.profileCompleted ?? false,
    isVerified: raw.isVerified ?? true,
    firebaseUid: raw.firebaseUid,
  };
}

function generateUsername(fullName: string): string {
  const base = fullName.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  return `${base}${String(Date.now()).slice(-4)}`;
}

async function markOnboardingDone(
  token: string,
  user: User,
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
) {
  await setToken(token);
  await setUser(user);
  const { setOnboardingComplete, setLocationGranted } = await import('../services/storage.service');
  await setOnboardingComplete();
  await setLocationGranted();
  setState({
    token,
    user,
    isLoading: false,
    isAuthenticated: true,
    hasCompletedOnboarding: true,
    hasLocationPermission: true,
  });
}

function hasCompletedNewOnboarding(user: User | null, localDone: boolean): boolean {
  if (!user || !localDone) return false;
  return Boolean(user.profileCompleted);
}

async function applySession(
  token: string,
  user: User,
  setState: React.Dispatch<React.SetStateAction<AuthState>>,
  completeOnboarding = false,
) {
  await setToken(token);
  await setUser(user);

  if (completeOnboarding || user.profileCompleted) {
    const { setOnboardingComplete, setLocationGranted } = await import('../services/storage.service');
    await setOnboardingComplete();
    await setLocationGranted();
  }

  setState((s) => ({
    ...s,
    token,
    user,
    isAuthenticated: true,
    hasCompletedOnboarding:
      completeOnboarding || user.profileCompleted ? true : s.hasCompletedOnboarding,
    hasLocationPermission:
      completeOnboarding || user.profileCompleted ? true : s.hasLocationPermission,
  }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    hasLocationPermission: false,
  });

  const lastLocalDigitsRef = useRef<string | null>(null);
  const logIdRef = useRef<string | null>(null);

  const bootstrap = useCallback(async () => {
    const [token, user, onboarding, location] = await Promise.all([
      getToken(),
      getUser(),
      isOnboardingComplete(),
      isLocationGranted(),
    ]);

    setState({
      token,
      user,
      isLoading: false,
      isAuthenticated: !!token && !!user,
      hasCompletedOnboarding: onboarding,
      hasLocationPermission: location,
    });
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const sendPhoneOtp = useCallback(async (localDigits: string) => {
    lastLocalDigitsRef.current = localDigits;
    try {
      const response = await authApi.sendOtp(localDigits);
      if (response.success && response.logId) {
        logIdRef.current = response.logId;
        return { isNewUser: true }; // We'll know for sure upon verification
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }
  }, []);

  const resendPhoneOtp = useCallback(async () => {
    if (lastLocalDigitsRef.current) {
      try {
        const response = await authApi.sendOtp(lastLocalDigitsRef.current);
        if (response.success && response.logId) {
          logIdRef.current = response.logId;
        } else {
          throw new Error(response.message || 'Failed to resend OTP');
        }
      } catch (error: any) {
        console.error('Resend OTP error:', error);
        throw new Error(error.message || 'Failed to resend OTP');
      }
    }
  }, []);

  const verifyPhoneOtp = useCallback(
    async (localDigits: string, otpCode: string, _isNewUser: boolean) => {
      try {
        if (!logIdRef.current) {
          throw new Error('No OTP request found. Please go back and request again.');
        }

        const response = await authApi.verifyOtp(localDigits, otpCode, logIdRef.current);
        
        if (!response.success || !response.token || !response.user) {
          throw new Error(response.message || 'Backend authentication failed');
        }

        const user = mapApiUser(response.user);
        const localOnboardingDone = await isOnboardingComplete();
        const profileDone = hasCompletedNewOnboarding(user, localOnboardingDone);

        // Set Session Locally
        await applySession(response.token, user, setState, profileDone);

        return { isNewUser: response.isNewUser ?? !profileDone };
      } catch (error: any) {
        console.error('Verify OTP Error:', error);
        throw new Error(error.message || 'Verification failed');
      }
    },
    [],
  );

  const finishOnboarding = useCallback(
    async (data: {
      fullName: string;
      mobileNumber: string;
      avatarId: string;
      gender: 'male' | 'female';
    }) => {
      const { fullName, mobileNumber, avatarId, gender } = data;
      const username = generateUsername(fullName);
      const [firstName, ...rest] = fullName.trim().split(' ');
      const lastName = rest.join(' ');

      const existingUser = state.user;
      const existingToken = state.token;

      if (!existingToken || !existingUser?.id) {
        throw new Error('Not signed in to update profile');
      }

      try {
        const profileRes = await userApi.updateProfile(existingUser.id, {
          firstName,
          lastName,
          username,
          avatarId,
          mobileNumber,
          gender,
          markComplete: true,
        });

        const user = mapApiUser({
          ...profileRes.user,
          id: existingUser.id,
          name: fullName,
          username,
          gender,
          profileCompleted: true,
        });

        await markOnboardingDone(existingToken, user, setState);
      } catch (e: any) {
        console.error('Finish Onboarding error:', e);
        // Fallback for offline development but ideally should not fail
        const user: User = {
          ...existingUser,
          name: fullName,
          firstName,
          lastName,
          username,
          avatarId,
          gender,
          mobileNumber,
          profileCompleted: true,
        };
        await markOnboardingDone(existingToken, user, setState);
      }
    },
    [state.user, state.token],
  );

  const completeProfile = useCallback(
    async (data: {
      fullName: string;
      username: string;
      avatarId: string;
      mobileNumber: string;
      city?: string;
    }) => {
      const userId = state.user?.id;
      if (!userId) {
        throw new ApiError('Not signed in', 401);
      }

      const [firstName, ...rest] = data.fullName.trim().split(' ');
      const profileRes = await userApi.updateProfile(userId, {
        firstName,
        lastName: rest.join(' '),
        username: data.username.replace(/^@/, ''),
        avatarId: data.avatarId,
        mobileNumber: data.mobileNumber,
        gender: data.avatarId.startsWith('female') ? 'female' : 'male',
        city: data.city,
        markComplete: true,
      });

      const user = mapApiUser({ ...profileRes.user, id: userId, name: data.fullName });
      await setUser(user);
      setState((s) => ({ ...s, user }));
    },
    [state.user?.id],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      hasLocationPermission: false,
    });
  }, []);

  const markLocationGranted = useCallback(
    async (city?: string) => {
      if (city && state.user?.id && !state.user.id.startsWith('local-')) {
        try {
          await userApi.updateProfile(state.user.id, { city, markComplete: true });
        } catch {
          // Continue — local onboarding should still finish
        }
        const updated = { ...state.user, city, profileCompleted: true };
        await setUser(updated);
        setState((s) => ({ ...s, user: updated }));
      } else if (state.user) {
        const updated = { ...state.user, city: city ?? state.user.city, profileCompleted: true };
        await setUser(updated);
        setState((s) => ({ ...s, user: updated }));
      }
      const { setLocationGranted, setOnboardingComplete } = await import(
        '../services/storage.service'
      );
      await setLocationGranted();
      await setOnboardingComplete();
      setState((s) => ({
        ...s,
        hasLocationPermission: true,
        hasCompletedOnboarding: true,
      }));
    },
    [state.user],
  );

  const refreshUser = useCallback(async (user: User) => {
    await setUser(user);
    setState((s) => ({ ...s, user }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      bootstrap,
      sendPhoneOtp,
      resendPhoneOtp,
      verifyPhoneOtp,
      finishOnboarding,
      completeProfile,
      logout,
      markLocationGranted,
      refreshUser,
    }),
    [
      state,
      bootstrap,
      sendPhoneOtp,
      resendPhoneOtp,
      verifyPhoneOtp,
      finishOnboarding,
      completeProfile,
      logout,
      markLocationGranted,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
