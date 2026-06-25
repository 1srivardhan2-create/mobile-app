import { apiRequest } from './client';

export interface NotificationModel {
  _id: string;
  userId: string;
  type: string;
  message: string;
  orderId?: string;
  cafeName?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export const notificationsApi = {
  getUserNotifications: (userId: string) =>
    apiRequest<{ success: boolean; notifications: NotificationModel[] }>(`/api/notifications/${userId}`, {
      auth: true,
    }),
};
