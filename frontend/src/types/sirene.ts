import { Village } from "./village";

export interface Sirene {
    id: number;
    imei: string | null;
    latitude: string | null;
    longitude: string | null;
    phone_number_brain: string | null;
    phone_number_relai: string | null;
    village_id: number;
    is_active: boolean;
    village?: Village;
}