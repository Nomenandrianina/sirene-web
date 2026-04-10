// ── Types partagés frontend ──────────────────────────────────────────────

export type Periode = 'weekly' | 'monthly';
export type SouscriptionStatus = 'active' | 'expired' | 'suspended' | 'pending';
export type DiffusionStatus = 'sent' | 'failed';

export interface PackType {
  id: number;
  name: string;
  description: string | null;
  frequenceParJour: number;
  joursParSemaine: number;
  joursAutorises: number[] | null;
  dureeMaxMinutes: number;
  prix: number;
  periode: Periode;
  isActive: boolean;
}

export interface Souscription {
  id: number;
  userId: number;
  packTypeId: number;
  sireneId: number;
  alerteAudioId: number;
  startDate: string;
  endDate: string;
  ordreCreneau: number;
  status: SouscriptionStatus;
  packType: PackType;
  // Stats calculées côté backend
  joursRestants?: number;
  estExpire?: boolean;
  dateFinFormatee?: string;
  createdAt: string;
}

export interface DiffusionLog {
  id: number;
  souscriptionId: number;
  scheduledAt: string;
  sentAt: string | null;
  status: DiffusionStatus;
  error: string | null;
  rawMessage: string | null;
  createdAt: string;
}

// DTOs frontend → backend
export interface CreateSouscriptionPayload {
  userId: number;
  packTypeId: number;
  sireneId: number;
  alerteAudioId: number;
  startDate?: string;
}

export interface Sirene {
  id: number;
  name?: string;
  phoneNumberBrain: string;
  isActive: boolean;
}

export interface AlerteAudio {
  id: number;
  name: string | null;
  mobileId: string;
  duration: number | null;
  sousCategorieAlerteId: number;
  sireneId: number;
}