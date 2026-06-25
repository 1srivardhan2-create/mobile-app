import { apiRequest } from './client';
import type { User } from '../types';

interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  user: User;
}

export const userApi = {
  updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      gender?: string;
      mobileNumber?: string;
      avatarId?: string;
      city?: string;
      username?: string;
      markComplete?: boolean;
    },
  ) {
    return apiRequest<ProfileUpdateResponse>(`/api/user/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
