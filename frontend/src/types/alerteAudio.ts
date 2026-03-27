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
  sousCategorie?: { id: number; name: string };
  Sirene?: {id:number;vname:string}
  createdAt?: string;
}