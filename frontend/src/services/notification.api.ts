import { NotificationFilters, NotificationStatus } from "@/types/notification";
import { get, del, patch } from "./base";


  function buildQuery(filters: NotificationFilters): string {
    const params = new URLSearchParams();
    if (filters.sireneId)              params.set("sireneId",              String(filters.sireneId));
    if (filters.status)                params.set("status",                filters.status);
    if (filters.startDate)             params.set("startDate",             filters.startDate);
    if (filters.endDate)               params.set("endDate",               filters.endDate);
    if (filters.sousCategorieAlerteId) params.set("sousCategorieAlerteId", String(filters.sousCategorieAlerteId));
    if (filters.userId)                params.set("userId",                String(filters.userId));
    if (filters.page)                  params.set("page",                  String(filters.page));
    if (filters.limit)                 params.set("limit",                 String(filters.limit));
    const q = params.toString();
    return q ? `?${q}` : "";
  }
    
  export const notificationsApi = {
    getAll:       (filters: NotificationFilters = {}) => get(`/notifications${buildQuery(filters)}`),
    getById:      (id: number)                        => get(`/notifications/${id}`),
    getStats:     ()                                  => get("/notifications/stats"),
    updateStatus: (id: number, dto: any)              => patch(`/notifications/${id}/status`, dto),
    remove:       (id: number)                        => del(`/notifications/${id}`),
  };