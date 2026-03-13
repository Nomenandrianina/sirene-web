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

export const avatarApi = {
  /** Upload ou remplacement de l'avatar */
  upload: async (file: File): Promise<{ avatar_url: string }> => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/users/avatar`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData, // Ne pas mettre Content-Type — le browser le gère
      }
    );

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur upload' }));
      throw new Error(err.message || 'Erreur upload avatar');
    }
    return response.json();
  },

  /** Supprimer l'avatar */
  remove: (): Promise<{ message: string }> =>
    import('./base').then(({ del }) => del('/users/avatar')),

  /** URL complète depuis le filename */
  getUrl: (filename: string | null | undefined): string | null => {
    if (!filename) return null;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${base}/uploads/avatars/${filename}`;
  },
};