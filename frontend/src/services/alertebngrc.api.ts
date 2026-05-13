import { AlerteBngrc } from '@/types/alerteBngrc';
import { get, post, patch, del } from './base';

export const alerteBngrcApi = {
    getAll:   ()                        => get("/alerte-bngrc"),
    getById:  (id: number)              => get(`/alerte-bngrc/${id}`),
    create:   (dto: Partial<AlerteBngrc>)    => post("/alerte-bngrc", dto),
    update:   (id: number, dto: any)    => patch(`/alerte-bngrc/${id}`, dto),
    remove:   (id: number)              => del(`/alerte-bngrc/${id}`),
};
