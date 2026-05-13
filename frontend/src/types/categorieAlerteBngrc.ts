import { TypeAlerteBngrc } from "./typeAlerteBngrc";

export interface CategorieAlerteBngrc {
  id: number;
  name: string;
  typeAlerteBngrcId:  number;
  alerteBngrcId?:     number;
  type?: TypeAlerteBngrc[];
}
