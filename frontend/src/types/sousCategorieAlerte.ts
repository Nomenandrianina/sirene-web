import { CategorieAlerte } from "./categorieAlerte";

export interface SousCategorieAlerte {
    id: number;
    name: string;
    categorieAlerteId: number;
    alerteId: number;
    alerteTypeId: number;
    categorieAlerte?: CategorieAlerte;
  }