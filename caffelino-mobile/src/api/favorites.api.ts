import { apiRequest } from './client';
import type { Cafe } from '../types';

export const favoritesApi = {
  getIds() {
    return apiRequest<{ success: boolean; cafeIds: string[] }>('/api/favorites/ids', {
      auth: true,
    });
  },

  list() {
    return apiRequest<{ success: boolean; favorites: Cafe[]; cafeIds: string[] }>(
      '/api/favorites',
      { auth: true },
    );
  },

  toggle(cafeId: string) {
    return apiRequest<{ success: boolean; loved: boolean; cafeId: string; cafe?: Cafe }>(
      '/api/favorites/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ cafeId }),
        auth: true,
      },
    );
  },
};
