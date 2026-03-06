// ─────────────────────────────────────────────
//  base.ts — Client HTTP partagé
//  Gère : token Bearer, 401 auto-logout, erreurs
// ─────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface ApiError {
  message: string;
  statusCode: number;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token'); // cohérent avec AuthContext
}

function clearSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Session expirée
  if (response.status === 401) {
    clearSession();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  // Erreur serveur
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    const error = new Error(err.message || `Erreur ${response.status}`) as Error & { statusCode: number };
    error.statusCode = response.status;
    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

// Helpers raccourcis
export const get  = <T>(url: string)                        => request<T>(url);
export const post = <T>(url: string, body: unknown)         => request<T>(url, { method: 'POST',  body: JSON.stringify(body) });
export const put  = <T>(url: string, body: unknown)         => request<T>(url, { method: 'PUT',   body: JSON.stringify(body) });
export const patch= <T>(url: string, body: unknown)         => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
export const del  = <T>(url: string)                        => request<T>(url, { method: 'DELETE' });
