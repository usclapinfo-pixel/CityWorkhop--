import { request } from './api-client';
import type { City, CityPage, CityQuery } from '../types/city';

function queryString(query: CityQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && value !== '' && params.set(key, String(value)));
  return params.toString();
}

export function getCities(query: CityQuery = {}) { return request<CityPage>(`/api/v1/admin/cities?${queryString(query)}`); }
export function createCity(input: Pick<City, 'name' | 'state' | 'district' | 'code'>) { return request<City>('/api/v1/admin/cities', { method: 'POST', body: JSON.stringify(input) }); }
export function updateCity(id: string, input: Partial<Pick<City, 'name' | 'state' | 'district' | 'code'>>) { return request<City>(`/api/v1/admin/cities/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function activateCity(id: string) { return request<City>(`/api/v1/admin/cities/${encodeURIComponent(id)}/activate`, { method: 'PATCH' }); }
export function deactivateCity(id: string) { return request<City>(`/api/v1/admin/cities/${encodeURIComponent(id)}/deactivate`, { method: 'PATCH' }); }
