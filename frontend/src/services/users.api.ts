// ─────────────────────────────────────────────
//  users.api.ts
//  Routes : /users
// ─────────────────────────────────────────────
import { get, post, put, del } from './base';
import type { User } from '@/types/user';

export interface CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  role_id: number;
  customer_id?: number;
}

export interface UpdateUserDto {
  full_name?: string;
  email?: string;
  role_id?: number;
  customer_id?: number;
  is_active?: boolean;
}

export interface UpdateProfileDto {
  full_name?: string;
  email?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export const usersApi = {
  /** Liste tous les utilisateurs */
  getAll: () =>
    get<User[]>('/users'),

  /** Détail d'un utilisateur */
  getById: (id: number) =>
    get<User>(`/users/${id}`),

  /** Profil de l'utilisateur connecté */
  getProfile: () =>
    get<User>('/users/profile'),

  /** Permissions de l'utilisateur connecté */
  getMyPermissions: () =>
    get<string[]>('/users/me/permissions'),

  /** Créer un utilisateur (admin) */
  create: (data: CreateUserDto) =>
    post<User>('/users', data),

  /** Modifier un utilisateur (admin) */
  update: (id: number, data: UpdateUserDto) =>
    put<User>(`/users/update-user/${id}`, data),

  /** Modifier son propre profil */
  updateProfile: (data: UpdateProfileDto) =>
    put<User>('/users/update-profile', data),

  /** Changer son mot de passe */
  changePassword: (data: ChangePasswordDto) =>
    put<{ message: string }>('/users/change-password', data),

  /** Supprimer un utilisateur */
  remove: (id: number) =>
    del<void>(`/users/${id}`),
};
