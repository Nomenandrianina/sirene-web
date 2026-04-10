import { get, post, patch, del } from './base';
import type {
  Souscription,
  CreateSouscriptionPayload, PackType, DiffusionLog
} from '../types/diffusion';

export const souscriptionApi = {
  getAll: (params?: { userId?: number; status?: string; sireneId?: number }) =>
    get<Souscription[]>('/souscriptions', { params }),

  getByUser: (userId: number) =>
    get<Souscription[]>(`/souscriptions/user/${userId}`),

  getById: (id: number) =>
    get<Souscription>(`/souscriptions/${id}`),  

  create: (data: CreateSouscriptionPayload) =>
    post<Souscription>('/souscriptions', data),

  update: (id: number, data: Partial<Souscription>) =>
    patch<Souscription>(`/souscriptions/${id}`, data),

  suspend: (id: number) =>
    patch<Souscription>(`/souscriptions/${id}/suspend`),

  reactivate: (id: number) =>
    patch<Souscription>(`/souscriptions/${id}/reactivate`),

  remove: (id: number) =>
    del<void>(`/souscriptions/${id}`),
};

export interface CreatePackTypeDto extends Partial<PackType> {}
export interface UpdatePackTypeDto extends Partial<PackType> {}

export const packTypeApi = {
  getAll: (onlyActive = false) =>
    get<PackType[]>(`/pack-types${onlyActive ? '?active=true' : ''}`),

  getById: (id: number) =>
    get<PackType>(`/pack-types/${id}`),

  create: (data: CreatePackTypeDto) =>
    post<PackType>('/pack-types', data),

  update: (id: number, data: UpdatePackTypeDto) =>
    patch<PackType>(`/pack-types/${id}`, data),

  remove: (id: number) =>
    del<void>(`/pack-types/${id}`),

};

export const diffusionLogApi = {
  getBySubscription: (souscriptionId: number) =>
    get<DiffusionLog[]>(`/diffusion-logs?souscriptionId=${souscriptionId}`),
};