import { get, post } from './base';

export interface SendAlerteBngrcPayload {
  categorieAlerteBngrcId: number;
  provinceIds?:           number[];
  regionIds?:             number[];
  districtIds?:           number[];
  villageIds?:            number[];
  repeatCount?:           number;
  repeatInterval?:        string;
  sendingTimeAfterAlerte?: string;
  alertPriority?:         'P1' | 'P2';
  userId?:                number;
}

export const sendAlerteBngrcApi = {
  send: (payload: SendAlerteBngrcPayload) =>
    post('/send-alerte-bngrc', payload),

  preview: (
    provinceIds:  number[],
    regionIds:    number[],
    districtIds:  number[],
    villageIds:   number[],
  ) => {
    const params = new URLSearchParams();
    if (provinceIds.length)  params.set('provinceIds',  provinceIds.join(','));
    if (regionIds.length)    params.set('regionIds',    regionIds.join(','));
    if (districtIds.length)  params.set('districtIds',  districtIds.join(','));
    if (villageIds.length)   params.set('villageIds',   villageIds.join(','));
    return get(`/send-alerte-bngrc/preview?${params.toString()}`);
  },
};
