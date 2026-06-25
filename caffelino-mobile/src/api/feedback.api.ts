import { apiRequest } from './client';
import type { Feedback } from '../types';

export const feedbackApi = {
  getAll(userId?: string) {
    const query = userId ? `?userId=${userId}` : '';
    return apiRequest<Feedback[]>(`/api/feedback${query}`);
  },

  create(payload: {
    userId: string;
    username: string;
    profileImage?: string;
    comment: string;
    rating: number;
  }) {
    return apiRequest<Feedback>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
