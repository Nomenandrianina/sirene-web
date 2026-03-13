import { Alerte } from '@/types/alerte';
import { get, post, patch, del } from './base';


export const alertesApi = {
    getAll:   ()                        => get("/alertes"),
    getById:  (id: number)              => get(`/alertes/${id}`),
    create:   (dto: Partial<Alerte>)    => post("/alertes", dto),
    update:   (id: number, dto: any)    => patch(`/alertes/${id}`, dto),
    remove:   (id: number)              => del(`/alertes/${id}`),
};