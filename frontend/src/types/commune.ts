import { District } from "./district";

export interface Commune {
    id: number;
    name: string;
    districtId:number;
    district?:  District;
}