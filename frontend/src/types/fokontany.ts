import type { Commune } from "./commune";

export interface Fokontany {
  id:        number;
  name:      string;
  communeId: number;
  commune?:  Commune;
}