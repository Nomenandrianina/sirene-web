import { AlerteType } from "./alerteType";

export interface Alerte {
  id: number;
  name: string;
  customers?: { id: number; name: string }[];
  types?: AlerteType[];
}