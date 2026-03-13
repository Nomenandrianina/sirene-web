import { get, post, patch, del } from './base';
import type { District } from '@/types/district';

export interface CreateDistrictDto {
  name: string;
  regionId: number;
}

export interface UpdateDistrictDto {
  name?: string;
  regionId?: string;
}

export const districtsApi = {
  /** Liste tous les provinces */
  getAll: () =>
    get<District[]>('/districts'),

  /** Détail d'un province */
  getById: (id: number) =>
    get<District>(`/districts/${id}`),

  /** Créer un province */
  create: (data: CreateDistrictDto) =>
    post<District>('/districts', data),

  /** Modifier un province */
  update: (id: number, data: UpdateDistrictDto) =>
    patch<District>(`/districts/${id}`, data),

  /** Supprimer un province */
  remove: (id: number) =>
    del<void>(`/districts/${id}`),
};
