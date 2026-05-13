import { CategorieAlerteBngrc } from "./categorieAlerteBngrc";
export type AudioBngrcStatus = 'pending' | 'approved' | 'rejected';

export interface AudioAlerteBngrc {
    id:                      number;
    name?:                   string;
    description?:            string;
    mobileId:                string;
    audio:                   string;
    originalFilename?:       string;
    fileSize?:               number;
    duration?:               number;
    categorieAlerteBngrcId:  number;
    categorie?:              CategorieAlerteBngrc;
    sirenes?:                { id: number; name: string; imei: string }[];
    status:                  AudioBngrcStatus;
    rejectionComment?:       string | null;
    createdByUserId?:        number;
    createdByUser?:          { first_name: string; last_name: string; email: string };
    createdAt?:              string;
    updatedAt?:              string;
}
  