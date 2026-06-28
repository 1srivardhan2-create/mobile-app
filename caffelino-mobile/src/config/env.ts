import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

/** Ensure you set EXPO_PUBLIC_API_BASE_URL before building for production (e.g., https://your-app.onrender.com) */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || extra?.apiBaseUrl || 'https://your-render-url.onrender.com';

export const SOCKET_URL = API_BASE_URL;
