import { AlerteAudio } from "./alerteAudio";
import { Sirene } from "./sirene";
import { SousCategorieAlerte } from "./sousCategorieAlerte";

export interface NotificationSireneAlerte {
    id: number;
    type: string | null;
    operator: string | null;
    status: string | null;
    message: string | null;
    sending_time: string | null;
    operator_status: string | null;
    phone_number: string | null;
    weather_id: number;
    alerte_audio_id: number;
    sirene_id: number;
    sous_categorie_alerte_id: number;
    customers_id: number;
    sending_time_after_alerte: string | null;
    sirene?: Sirene;
    sous_categorie_alerte?: SousCategorieAlerte;
    alerte_audio?: AlerteAudio;
}
  