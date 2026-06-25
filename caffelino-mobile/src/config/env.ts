import Constants from 'expo-constants';

/** Render backend — works from real phones on Expo Go */
const PRODUCTION_API = 'https://hydraulic-aerial-height-myself.trycloudflare.com';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

/** Never use localhost on a physical device — always hit Render unless overridden in .env */
export const API_BASE_URL = PRODUCTION_API;

export const SOCKET_URL = API_BASE_URL;

