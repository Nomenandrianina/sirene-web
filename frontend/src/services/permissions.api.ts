// ─────────────────────────────────────────────
//  permissions.api.ts
//  Routes : /permissions
// ─────────────────────────────────────────────
import { get, post, patch, del } from './base';
import type { Permission } from '@/types/permission';

export interface CreatePermissionDto {
  name: string;
  description?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
}

export const permissionsApi = {
  /** Liste toutes les permissions */
  getAll: () =>
    get<Permission[]>('/permissions'),

  /** Détail d'une permission */
  getById: (id: number) =>
    get<Permission>(`/permissions/${id}`),

  /** Créer une permission */
  create: (data: CreatePermissionDto) =>
    post<Permission>('/permissions', data),

  /** Modifier une permission */
  update: (id: number, data: UpdatePermissionDto) =>
    patch<Permission>(`/permissions/${id}`, data),

  /** Supprimer une permission */
  remove: (id: number) =>
    del<void>(`/permissions/${id}`),
};
