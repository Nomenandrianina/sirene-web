import { Village } from "./village";

export interface Sirene {
    id:               number;
    name:             string | null;
    imei:             string | null;
    latitude:         string | null;
    longitude:        string | null;
    phoneNumberBrain: string | null;
    phoneNumberRelai: string | null;
    communicationType: string | null;
    villageId:        number;
    isActive:         number;
    village?:         Village;
    customers?:       { id: number; name: string }[];
}

    