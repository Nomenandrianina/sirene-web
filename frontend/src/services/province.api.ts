import { get, post, patch, del } from './base';
import type { Province } from '@/types/province';

export interface CreateProvinceDto {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export interface UpdateProvinceDto {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export const provincesApi = {
  /** Liste tous les provinces */
  getAll: () =>
    get<Province[]>('/provinces'),

  /** Détail d'un province */
  getById: (id: number) =>
    get<Province>(`/provinces/${id}`),

  /** Créer un province */
  create: (data: CreateProvinceDto) =>
    post<Province>('/provinces', data),

  /** Modifier un province */
  update: (id: number, data: UpdateProvinceDto) =>
    patch<Province>(`/provinces/${id}`, data),

  /** Supprimer un province */
  remove: (id: number) =>
    del<void>(`/provinces/${id}`),
};
