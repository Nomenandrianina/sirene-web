// ========== Auth & Users ==========

import { User } from "./User";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface DashboardStats {
  totalSirenes: number;
  activeSirenes: number;
  alertesToday: number;
  alertesMonth: number;
  successRate: number;
}

// ========== Send Alert Request ==========
export interface SendAlertRequest {
  alerte_id: number;
  alerte_type_id: number;
  categorie_alerte_id: number;
  sous_categorie_alerte_id: number;
  sirene_ids: number[];
  scheduled_time: string | null; // null = now, ISO string = later
}
