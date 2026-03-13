import { AlerteType } from "@/types/alerteType";
import { get, post, patch, del } from './base';

export const alerteTypesApi = {
    getAll:   (alerteId?: number)            => get(`/alerte-types${alerteId ? `?alerteId=${alerteId}` : ""}`),
    getById:  (id: number)                   => get(`/alerte-types/${id}`),
    create:   (dto: Partial<AlerteType>)     => post("/alerte-types", dto),
    update:   (id: number, dto: any)         => patch(`/alerte-types/${id}`, dto),
    remove:   (id: number)                   => del(`/alerte-types/${id}`),
  };