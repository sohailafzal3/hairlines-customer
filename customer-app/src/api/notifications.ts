import { apiClient } from './client';
import { NotificationModel } from '../models';
import { kOffSet } from '../constants';

export const NotificationsApi = {
  fetchNotifications: (offset: number = 0, limit: number = kOffSet) =>
    apiClient.get<NotificationModel[]>(`user-notification?limit=${limit}&offset=${offset}`),

  actionNotifications: (type: number | 'read' | 'delete') => {
    const numType = typeof type === 'number' ? type : type === 'read' ? 1 : 2;
    return apiClient.post('action-notifications', { type: numType, userType: 'user' });
  },
};
