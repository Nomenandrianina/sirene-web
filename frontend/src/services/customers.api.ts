// ─────────────────────────────────────────────
//  customers.api.ts
//  Routes : /customers
// ─────────────────────────────────────────────
import { get, post, patch, del } from './base';
import type { Customer } from '@/types/customer';

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const customersApi = {
  /** Liste tous les clients */
  getAll: () =>
    get<Customer[]>('/customers'),

  /** Détail d'un client */
  getById: (id: number) =>
    get<Customer>(`/customers/${id}`),

  /** Créer un client */
  create: (data: CreateCustomerDto) =>
    post<Customer>('/customers', data),

  /** Modifier un client */
  update: (id: number, data: UpdateCustomerDto) =>
    patch<Customer>(`/customers/${id}`, data),

  /** Supprimer un client */
  remove: (id: number) =>
    del<void>(`/customers/${id}`),
};
