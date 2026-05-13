import { NotificationBngrcFilters } from '@/types/NotificationBngrc';
import { get, del }                 from './base';

// ── Builder de query string — même pattern que notificationsApi ───────────────

function buildQuery(filters: NotificationBngrcFilters): string {
  const params = new URLSearchParams();
  if (filters.sireneId)               params.set('sireneId',               String(filters.sireneId));
  if (filters.status)                 params.set('status',                 filters.status);
  if (filters.startDate)              params.set('startDate',              filters.startDate);
  if (filters.endDate)                params.set('endDate',                filters.endDate);
  if (filters.categorieAlerteBngrcId) params.set('categorieAlerteBngrcId', String(filters.categorieAlerteBngrcId));
  if (filters.userId)                 params.set('userId',                 String(filters.userId));
  if (filters.page)                   params.set('page',                   String(filters.page));
  if (filters.limit)                  params.set('limit',                  String(filters.limit));
  const q = params.toString();
  return q ? `?${q}` : '';
}

// ── API ───────────────────────────────────────────────────────────────────────

export const notificationsBngrcApi = {
  getAll:  (filters: NotificationBngrcFilters = {}) =>
    get(`/notification-bngrc${buildQuery(filters)}`),

  getById: (id: number) =>
    get(`/notification-bngrc/${id}`),

  getStats: (filters: Partial<NotificationBngrcFilters> = {}) => {
    const params = new URLSearchParams();
    if (filters.sireneId)               params.append('sireneId',               String(filters.sireneId));
    if (filters.categorieAlerteBngrcId) params.append('categorieAlerteBngrcId', String(filters.categorieAlerteBngrcId));
    if (filters.startDate)              params.append('startDate',              filters.startDate);
    if (filters.endDate)                params.append('endDate',                filters.endDate);
    return get(`/notification-bngrc/stats?${params.toString()}`);
  },

  remove: (id: number) => del(`/notification-bngrc/${id}`),
};