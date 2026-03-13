const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("dsd",API_BASE_URL)

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
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

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      throw new Error('Non autorisé');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return response.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<import('@/types/api').LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Alertes
  // getAlertes() { return this.request<import('@/types/api').Alerte[]>('/alertes'); }
  // getAlerteTypes(alerteId: number) { return this.request<import('@/types/api').AlerteType[]>(`/alerte-types?alerte_id=${alerteId}`); }
  // getCategorieAlertes(alerteTypeId: number) { return this.request<import('@/types/api').CategorieAlerte[]>(`/categorie-alertes?alerte_type_id=${alerteTypeId}`); }
  // getSousCategorieAlertes(categorieId: number) { return this.request<import('@/types/api').SousCategorieAlerte[]>(`/sous-categorie-alertes?categorie_alerte_id=${categorieId}`); }
  // sendAlert(data: import('@/types/api').SendAlertRequest) {
  //   return this.request<{ message_id: string }>('/alertes/send', { method: 'POST', body: JSON.stringify(data) });
  // }

  // // Audios
  // getAlerteAudios() { return this.request<import('@/types/api').AlerteAudio[]>('/alerte-audios'); }
  // getAlerteAudioBySousCategorie(sousCategorieId: number) { return this.request<import('@/types/api').AlerteAudio>(`/alerte-audios/sous-categorie/${sousCategorieId}`); }

  // // Géographie
  // getProvinces() { return this.request<import('@/types/api').Province[]>('/provinces'); }
  // getRegions(provinceId?: number) { return this.request<import('@/types/api').Region[]>(provinceId ? `/regions?province_id=${provinceId}` : '/regions'); }
  // getDistricts(regionId?: number) { return this.request<import('@/types/api').District[]>(regionId ? `/districts?region_id=${regionId}` : '/districts'); }
  // getVillages(districtId?: number) { return this.request<import('@/types/api').Village[]>(districtId ? `/villages?district_id=${districtId}` : '/villages'); }

  // // Sirènes
  // getSirenes() { return this.request<import('@/types/api').Sirene[]>('/sirenes'); }
  // getSirenesByZone(params: { province_ids?: number[]; region_ids?: number[]; district_ids?: number[] }) {
  //   const query = new URLSearchParams();
  //   params.province_ids?.forEach(id => query.append('province_ids', String(id)));
  //   params.region_ids?.forEach(id => query.append('region_ids', String(id)));
  //   params.district_ids?.forEach(id => query.append('district_ids', String(id)));
  //   return this.request<import('@/types/api').Sirene[]>(`/sirenes/by-zone?${query.toString()}`);
  // }
  // createSirene(data: Partial<import('@/types/api').Sirene>) { return this.request<import('@/types/api').Sirene>('/sirenes', { method: 'POST', body: JSON.stringify(data) }); }
  // updateSirene(id: number, data: Partial<import('@/types/api').Sirene>) { return this.request<import('@/types/api').Sirene>(`/sirenes/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }

  // // Notifications
  // getNotifications(page = 1, limit = 20) { return this.request<{ data: import('@/types/api').NotificationSireneAlerte[]; total: number }>(`/notifications?page=${page}&limit=${limit}`); }

  // // Dashboard
  // getDashboardStats() { return this.request<import('@/types/api').DashboardStats>('/dashboard/stats'); }
  // getAlertesChart(days = 30) { return this.request<{ date: string; count: number }[]>(`/dashboard/alertes-chart?days=${days}`); }

  // // Users
  // getUsers() { return this.request<import('@/types/api').User[]>('/users'); }
  // createUser(data: Partial<import('@/types/api').User & { password: string }>) { return this.request<import('@/types/api').User>('/users', { method: 'POST', body: JSON.stringify(data) }); }
  // updateUser(id: number, data: Partial<import('@/types/api').User>) { return this.request<import('@/types/api').User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }

  // // Customers
  // getCustomers() { return this.request<import('@/types/api').Customer[]>('/customers'); }
  // createCustomer(data: Partial<import('@/types/api').Customer>) { return this.request<import('@/types/api').Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }); }
  // updateCustomer(id: number, data: Partial<import('@/types/api').Customer>) { return this.request<import('@/types/api').Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }

  // // Roles
  // getRoles() { return this.request<import('@/types/api').Role[]>('/roles'); }
}

export const api = new ApiService();
