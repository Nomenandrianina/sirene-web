import { Village } from "./village";

export interface Sirene {
    id:               number;
    imei:             string | null;
    latitude:         string | null;
    longitude:        string | null;
    phoneNumberBrain: string | null;
    phoneNumberRelai: string | null;
    villageId:        number;
    isActive:         number;
    village?:         { id: number; name: string; latitude: string; longitude: string };
    customers?:       { id: number; name: string }[];
}