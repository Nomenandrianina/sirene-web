import { get, post, patch, del } from './base';
import type { Region } from '@/types/region';

export interface CreateRegionDto {
  name: string;
  provinceId: number;
}

export interface UpdateRegionDto {
  name?: string;
  provinceId?: string;
}

export const regionsApi = {
  /** Liste tous les provinces */
  getAll: () =>
    get<Region[]>('/regions'),

  /** Détail d'un province */
  getById: (id: number) =>
    get<Region>(`/regions/${id}`),

  /** Créer un province */
  create: (data: CreateRegionDto) =>
    post<Region>('/regions', data),

  /** Modifier un province */
  update: (id: number, data: UpdateRegionDto) =>
    patch<Region>(`/regions/${id}`, data),

  /** Supprimer un province */
  remove: (id: number) =>
    del<void>(`/regions/${id}`),
};
