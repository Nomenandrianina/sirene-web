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
  Sirene?: {id:number;vname:string}
  customer?: {id:number;vname:string}
  createdAt?: string;
  customerId?:number;
  alerteTypeId:      number;   
  alerteId:          number;   
}

export interface UsedCombination {
  sousCategorieId: number;
  sireneId:        number;
}