
export type NotificationStatus = "sent" | "unknown" | "failed" | "pending" | "delivery";
export type OrangeStatus = "DeliveredToNetwork" | "DeliveryUncertain" | "DeliveryImpossible" | "MessageWaiting" | "DeliveredToTerminal";
 
export interface NotificationFilters {
    sireneId?:              number;
    status?:                NotificationStatus;
    startDate?:             string;
    endDate?:               string;
    sousCategorieAlerteId?: number;
    userId?:                number;
    page?:                  number;
    limit?:                 number;
  }
   
  export interface NotificationListResponse {
    data:     Notification[];
    total:    number;
    page:     number;
    lastPage: number;
  }
   

export interface Notification {
    id: number;
    type?: string;
    operator?: string;
    status?: NotificationStatus;
    message: string;
    sendingTime?: string;
    operatorStatus?: string;
    phoneNumber?: string;
    orangeStatus?: OrangeStatus;
    observation?: string;
    sendingTimeAfterAlerte?: string;
    createdAt: string;
    sireneId: number;
    alerteAudioId: number;
    sousCategorieAlerteId: number;
    userId?: number;
    sirene?:        { id: number; imei: string; phoneNumberBrain: string };
    alerteAudio?:   { id: number; name: string };
    sousCategorie?: { id: number; name: string };
    user?:          { id: number; first_name: string; last_name: string };
}