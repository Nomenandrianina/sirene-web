import { SousCategorieAlerte } from "@/types/sousCategorieAlerte";
import { get, post, patch, del } from './base';

export const sousCategorieAlertesApi = {
    getAll:   (categorieAlerteId?: number)              => get(`/sous-categorie-alertes${categorieAlerteId ? `?categorieAlerteId=${categorieAlerteId}` : ""}`),
    getById:  (id: number)                              => get(`/sous-categorie-alertes/${id}`),
    create:   (dto: Partial<SousCategorieAlerte>)       => post("/sous-categorie-alertes", dto),
    update:   (id: number, dto: any)                    => patch(`/sous-categorie-alertes/${id}`, dto),
    remove:   (id: number)                              => del(`/sous-categorie-alertes/${id}`),
};