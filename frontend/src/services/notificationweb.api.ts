import { NotificationWeb } from '@/types/notificationweb';
import { get, post, patch, del } from './base';

export const notificationsWebApi = {
    // getUnread: (): Promise<NotificationWeb[]> =>
    //   api.get('/notificationsweb/unread').then(r => r.data),

    getUnread: () =>   get<NotificationWeb[]>('/notificationsweb/unread'),
    
    getAll: () => get<NotificationWeb[]>('/notificationsweb'),
  
    markRead: (id: number) =>  patch<NotificationWeb>(`/notificationsweb/${id}/read`),

    markAllRead: () => patch('/notificationsweb/read-all')
};