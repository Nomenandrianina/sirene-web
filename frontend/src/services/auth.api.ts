// ─────────────────────────────────────────────
//  auth.api.ts
//  Routes : /auth
// ─────────────────────────────────────────────
import { post } from './base';
import type { LoginResponse } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    post<LoginResponse>('/auth/login', { email, password }),
};
