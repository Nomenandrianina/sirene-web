import { CategorieAlerteBngrc } from '@/types/categorieAlerteBngrc';
import { get, post, patch, del } from './base';

export const categorieAlerteBngrcApi = {
    getAll:      ()                                          => get('/categorie-alerte-bngrc'),
    getByType:   (typeAlerteBngrcId: number)                 => get(`/categorie-alerte-bngrc?typeAlerteBngrcId=${typeAlerteBngrcId}`),
    getByAlerte: (alerteBngrcId: number)                     => get(`/categorie-alerte-bngrc?alerteBngrcId=${alerteBngrcId}`),
    getById:     (id: number)                                => get(`/categorie-alerte-bngrc/${id}`),
    create:      (dto: Partial<CategorieAlerteBngrc>)        => post('/categorie-alerte-bngrc', dto),
    update:      (id: number, dto: Partial<CategorieAlerteBngrc>) => patch(`/categorie-alerte-bngrc/${id}`, dto),
    remove:      (id: number)                                => del(`/categorie-alerte-bngrc/${id}`),
  };
  