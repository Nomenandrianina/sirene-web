import { get, post, patch, del } from './base';
import type { Role } from '@/types/role';

export interface CreateRoleDto {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export const rolesApi = {
  /** Liste tous les rôles */
  getAll: () =>
    get<Role[]>('/roles'),

  /** Détail d'un rôle */
  getById: (id: number) =>
    get<Role>(`/roles/${id}`),

  /** Créer un rôle */
  create: (data: CreateRoleDto) =>
    post<Role>('/roles', data),

  /** Modifier un rôle */
  update: (id: number, data: UpdateRoleDto) =>
    patch<Role>(`/roles/${id}`, data),

  /** Supprimer un rôle */
  remove: (id: number) =>
    del<void>(`/roles/${id}`),
};
