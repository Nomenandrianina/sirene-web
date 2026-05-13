import { TypeAlerteBngrc } from '@/types/typeAlerteBngrc';
import { get, post, patch, del } from './base';

export const typeAlerteBngrcApi = {
    getAll:         ()                                    => get('/type-alerte-bngrc'),
    getByAlerte:    (alerteBngrcId: number)               => get(`/type-alerte-bngrc?alerteBngrcId=${alerteBngrcId}`),
    getById:        (id: number)                          => get(`/type-alerte-bngrc/${id}`),
    create:         (dto: Partial<TypeAlerteBngrc>)       => post('/type-alerte-bngrc', dto),
    update:         (id: number, dto: Partial<TypeAlerteBngrc>) => patch(`/type-alerte-bngrc/${id}`, dto),
    remove:         (id: number)                          => del(`/type-alerte-bngrc/${id}`),
};
