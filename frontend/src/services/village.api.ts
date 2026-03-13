import { get, post, patch, del } from './base';
import type { Village } from '@/types/village';

export interface CreateVillageDto {
  name:       string;
  latitude:   string;
  longitude:  string;
  provinceId: number;
  regionId:   number;
  districtId: number;
}

export interface UpdateVillageDto {
  name?:       string;
  latitude?:   string;
  longitude?:  string;
  provinceId?: number;
  regionId?:   number;
  districtId?: number;
}

export const villagesApi = {
  getAll:   ()                          => get<Village[]>('/villages'),
  getById:  (id: number)                => get<Village>(`/villages/${id}`),
  create:   (data: CreateVillageDto)    => post<Village>('/villages', data),
  update:   (id: number, data: UpdateVillageDto) => patch<Village>(`/villages/${id}`, data),
  remove:   (id: number)                => del<void>(`/villages/${id}`),
};