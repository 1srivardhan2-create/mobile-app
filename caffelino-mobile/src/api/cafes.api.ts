import { apiRequest } from './client';
import type { Cafe } from '../types';

interface ApprovedCafesResponse {
  success: boolean;
  cafes: Cafe[];
  totalCount: number;
}

export const cafesApi = {
  getApproved(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return apiRequest<ApprovedCafesResponse>(`/api/cafe/approved${query}`);
  },

  getById(cafeId: string) {
    return apiRequest<{ success: boolean; cafe: Cafe }>(`/api/cafe/public/detail/${cafeId}`);
  },
};
