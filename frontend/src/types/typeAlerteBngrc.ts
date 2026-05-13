import { AlerteBngrc } from "./alerteBngrc";
import { AlerteType } from "./alerteType";
import { categorieAlerteBngrc } from "./categorieAlerteBngrc";

export interface TypeAlerteBngrc {
    id:             number;
    name:           string;
    description?:   string;
    alerteBngrcId:  number;
    alerte?:        AlerteBngrc;
    categories?:    categorieAlerteBngrc[];
    createdAt?:     string;
    updatedAt?:     string;
  }
  