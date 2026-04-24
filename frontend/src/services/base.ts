
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export interface ApiError {
  message: string;
  statusCode: number;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token'); // cohérent avec AuthContext²
}

function clearSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  return query.toString() ? `?${query.toString()}` : '';
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
export const get = <T>(
  url: string,
  options?: { params?: Record<string, any> }
) => {
  const query = buildQuery(options?.params);
  return request<T>(`${url}${query}`);
};
export const post = <T>(url: string, body: unknown)         => request<T>(url, { method: 'POST',  body: JSON.stringify(body) });
export const put  = <T>(url: string, body: unknown)         => request<T>(url, { method: 'PUT',   body: JSON.stringify(body) });
export const patch = <T>(url: string, body?: unknown) =>  request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined,});
export const del  = <T>(url: string)                        => request<T>(url, { method: 'DELETE' });
