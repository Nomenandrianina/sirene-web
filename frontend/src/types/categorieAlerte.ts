import { AlerteType } from "./alerteType";
import { SousCategorieAlerte } from "./sousCategorieAlerte";

export interface CategorieAlerte {
    id: number;
    name: string;
    alerteTypeId: number;
    alerteType?: AlerteType;
    sousCategories?: SousCategorieAlerte[];
}