export type AudioValidationStatus = 'pending' | 'approved' | 'rejected';

export interface AlerteAudio {
  id: number;
  name?: string;
  description?: string;
  mobileId: string;
  audio: string;          // chemin serveur ex: uploads/audios/xxx.mp3
  originalFilename?: string;
  fileSize?: number;
  duration?: number;
  sousCategorieAlerteId: number;
  categorieAlerteId?:number;
  newSousCatName?: string;
  sousCategorie?: { id: number; name: string };
  sirenes?: { id: number; name: string }[];
  customer?: {id:number;name:string}
  createdAt?: string;
  customerId?:number;
  createdByUserId?:number;
  alerteTypeId:      number;   
  alerteId:          number;   
  status:            AudioValidationStatus;
  rejectionComment:  string | null;
  createdByUser?: {first_name:string, last_name:string, email:string},
}

export interface UsedCombination {
  sousCategorieId: number;
  sireneId:        number;
}