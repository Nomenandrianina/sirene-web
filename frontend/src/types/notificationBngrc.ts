// ── Statuts — miroir de l'entité backend ─────────────────────────────────────

export type NotificationBngrcStatus =
  | 'sent'
  | 'unknown'
  | 'failed'
  | 'pending'
  | 'delivery';

// ── Filtres de liste ──────────────────────────────────────────────────────────

export interface NotificationBngrcFilters {
  sireneId?:               number;
  status?:                 NotificationBngrcStatus;
  startDate?:              string;
  endDate?:                string;
  categorieAlerteBngrcId?: number;
  userId?:                 number;
  page?:                   number;
  limit?:                  number;
}

// ── Réponse paginée ───────────────────────────────────────────────────────────

export interface NotificationBngrcListResponse {
  data:     NotificationBngrc[];
  total:    number;
  page:     number;
  lastPage: number;
}

// ── Entité principale ─────────────────────────────────────────────────────────

export interface NotificationBngrc {
  id:                      number;
  type?:                   string;   // "BNGRC — <nom catégorie>"
  operator?:               string;
  status?:                 NotificationBngrcStatus;
  message:                 string;
  sendingTime?:            string;
  operatorStatus?:         string;
  phoneNumber?:            string;
  observation?:            string;
  sendingTimeAfterAlerte?: string;
  createdAt:               string;

  // Clés étrangères
  sireneId:               number;
  audioBngrcId?:          number | null;
  categorieAlerteBngrcId?: number | null;
  userId?:                number | null;

  // Relations chargées par le backend
  sirene?: {
    id:               number;
    imei:             string;
    name?:            string;
    phoneNumberBrain?: string;
    village?: {
      name?:    string;
      region?:  { name?: string };
    };
  };

  audioBngrc?: {
    id:                number;
    name?:             string;
    originalFilename?: string;
    audio:             string;
    duration?:         number;
    mobileId:          string;
  };

  categorieAlerteBngrc?: {
    id:    number;
    name:  string;
    type?: { id: number; name: string };
  };

  user?: {
    id:         number;
    first_name: string;
    last_name:  string;
    email?:     string;
  };
}