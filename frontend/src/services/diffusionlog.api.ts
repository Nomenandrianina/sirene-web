// services/diffusion-config.api.ts
import { get, post, patch, del ,put } from "@/services/base"; // adapte selon ton instance axios

export interface DiffusionConfig {
  id?: number;
  regionId: number | null;
  label: string;
  sendHour: number;
  sendMinute: number;
  sendDays: number[] | null;
  isActive: boolean;
}

export const diffusionConfigApi = {
  getAll: () =>  get<DiffusionConfig[]>('/diffusion-config'),

  upsert: (dto: DiffusionConfig) => put<DiffusionConfig>("/diffusion-config", dto),

  delete: (id: number) => del<void>(`/diffusion-config/${id}`),
};