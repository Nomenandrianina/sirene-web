import { get, post, patch, del } from './base';
import {Sirene } from '@/types/sirene'

export interface CreateSireneDto {
    imei?:             string;
    name?:             string;
    latitude?:         string;
    longitude?:        string;
    phoneNumberBrain?: string;
    phoneNumberRelai?: string;
    villageId:         number;
    isActive?:         number;
    customerIds?:      number[];
  }

export interface UpdateSireneDto extends Partial<CreateSireneDto> {}

export const sirenesApi = {
getAll:      ()                              => get<Sirene[]>('/sirenes'),
getAvalaibleMessage:      ()                              => get<any>('/sirenes/messageavailable'),
getById:     (id: number)                   => get<Sirene>(`/sirenes/${id}`),
create:      (data: CreateSireneDto)        => post<Sirene>('/sirenes', data),
update:      (id: number, data: UpdateSireneDto) => patch<Sirene>(`/sirenes/${id}`, data),
remove:      (id: number)                   => del<void>(`/sirenes/${id}`),
sendAlert:   (id: number, message: string)  => post<any>(`/sirenes/${id}/alert`, { message }),
};