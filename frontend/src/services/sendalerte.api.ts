import { get, post } from "./base";

export interface SendAlertePayload {
  alerteId:              number;
  alerteTypeId:          number;
  categorieAlerteId:     number;
  sousCategorieAlerteId: number;
  provinceIds?:          number[];
  regionIds?:            number[];
  districtIds?:          number[];
  sendingTimeAfterAlerte?: string; // ISO string ou absent = maintenant
  userId?:               number;
}

export interface SendAlerteResult {
  created: number;
  sent:    number;
  planned: number;
}

export interface SirenePreview {
  sireneCount: number;
  sirenes: { id: number; imei: string; phoneNumberBrain: string; village?: { name: string } }[];
}

export const sendAlerteApi = {
  send: (payload: SendAlertePayload): Promise<SendAlerteResult> =>
    post("/send-alerte", payload),

  preview: (provinceIds: number[], regionIds: number[], districtIds: number[]): Promise<SirenePreview> => {
    const params = new URLSearchParams();
    if (provinceIds.length)  params.set("provinceIds",  provinceIds.join(","));
    if (regionIds.length)    params.set("regionIds",    regionIds.join(","));
    if (districtIds.length)  params.set("districtIds",  districtIds.join(","));
    return get(`/send-alerte/preview?${params.toString()}`);
  },
};