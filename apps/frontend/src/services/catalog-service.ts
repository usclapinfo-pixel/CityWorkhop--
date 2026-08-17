import { request } from './api-client';
import type { ApplianceType, PublicCity, ServiceOffering } from '../types/catalog';

export function getPublicCities() {
  return request<PublicCity[]>('/api/v1/catalog/cities');
}

export function getAppliances() {
  return request<ApplianceType[]>('/api/v1/catalog/appliances');
}

export function getServicesForAppliance(applianceId: string, cityId: string) {
  const query = new URLSearchParams({ cityId }).toString();
  return request<ServiceOffering[]>(`/api/v1/catalog/appliances/${encodeURIComponent(applianceId)}/services?${query}`);
}
