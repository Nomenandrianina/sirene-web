import { get, post, patch, del } from './base';
import type { Fokontany } from "@/types/fokontany";

export interface CreateFokontanyPayload {
  name:      string;
  communeId: number;
}

export interface UpdateFokontanyPayload extends Partial<CreateFokontanyPayload> {}

export const fokontanyApi = {
  /** GET /fokontany */
  getAll: (): Promise<Fokontany[]> => get("/fokontany"),

  /** GET /fokontany?communeId=X */
  getByCommune: (communeId: number): Promise<Fokontany[]> => get(`/fokontany?communeId=${communeId}`),

  /** GET /fokontany/:id */
  getById: (id: number): Promise<Fokontany> => get(`/fokontany/${id}`),

  /** POST /fokontany */
  create: (payload: CreateFokontanyPayload): Promise<Fokontany> =>  post("/fokontany", payload),

  /** PATCH /fokontany/:id */
  update: (id: number, payload: UpdateFokontanyPayload): Promise<Fokontany> =>    patch(`/fokontany/${id}`, payload),

  /** DELETE /fokontany/:id */
  delete: (id: number): Promise<void> => del(`/fokontany/${id}`),
};