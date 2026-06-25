import { apiRequest } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  sendOtp(mobileNumber: string, timeout = 10000) {
    return apiRequest<{ success: boolean; logId: string; message?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber }),
      timeout,
    });
  },

  verifyOtp(mobileNumber: string, otp: string, logId: string, timeout = 12000) {
    return apiRequest<{ success: boolean; token: string; user: User; isNewUser: boolean; message?: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp, logId }),
      timeout,
    });
  },

  signup(fullName: string, mobileNumber: string, timeout = 12000) {
    return apiRequest<AuthResponse>('/api/auth/mobile-signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, mobileNumber }),
      timeout,
    });
  },
};
