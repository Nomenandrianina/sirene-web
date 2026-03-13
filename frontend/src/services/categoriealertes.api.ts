import { AlerteType } from '@/types/alerteType';
import { get, post, patch, del } from './base';
import { CategorieAlerte } from '@/types/categorieAlerte';


export const categorieAlertesApi = {
    getAll:   (alerteTypeId?: number)             => get(`/categorie-alertes${alerteTypeId ? `?alerteTypeId=${alerteTypeId}` : ""}`),
    getById:  (id: number)                        => get(`/categorie-alertes/${id}`),
    create:   (dto: Partial<CategorieAlerte>)     => post("/categorie-alertes", dto),
    update:   (id: number, dto: any)              => patch(`/categorie-alertes/${id}`, dto),
    remove:   (id: number)                        => del(`/categorie-alertes/${id}`),
  };