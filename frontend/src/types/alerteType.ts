import { Alerte } from "./alerte";
import { CategorieAlerte } from "./categorieAlerte";

export interface AlerteType {
    id: number;
    name: string;
    alerteId: number;
    alerte?: Alerte;
    categories?: CategorieAlerte[];
  }