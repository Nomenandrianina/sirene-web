import { get, post, patch, del } from './base';
import type { Commune } from "@/types/commune";

export interface CreateCommunePayload {
  name:       string;
  districtId: number;
}

export interface UpdateCommunePayload extends Partial<CreateCommunePayload> {}

export const communesApi = {
  /** GET /communes */
  getAll: (): Promise<Commune[]> =>
    get("/communes"),

  /** GET /communes?districtId=X */
  getByDistrict: (districtId: number): Promise<Commune[]> => get(`/communes/?districtId=${districtId}`),

  /** GET /communes/:id */
  getById: (id: number): Promise<Commune> =>
    get(`/communes/${id}`),

  /** POST /communes */
  create: (payload: CreateCommunePayload): Promise<Commune> =>
    post("/communes", payload),

  /** PATCH /communes/:id */
  update: (id: number, payload: UpdateCommunePayload): Promise<Commune> =>
    patch(`/communes/${id}`, payload),

  /** DELETE /communes/:id */
  delete: (id: number): Promise<void> =>
  del(`/communes/${id}`),
};