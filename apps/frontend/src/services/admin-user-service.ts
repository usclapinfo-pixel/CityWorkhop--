import { request } from './api-client';
import type { AdminUser, KycRecord } from '../types/admin';

const userPath = (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}`;

export function getPendingUsers() {
  return request<AdminUser[]>('/api/v1/admin/users/pending');
}

export function getAdminUser(id: string) {
  return request<AdminUser>(userPath(id));
}

export function getAdminUserKyc(id: string) {
  return request<KycRecord[]>(`${userPath(id)}/kyc`);
}

export function reviewAdminUser(id: string) {
  return request<AdminUser>(`${userPath(id)}/review`, { method: 'PATCH' });
}

export function approveAdminUser(id: string) {
  return request<AdminUser>(`${userPath(id)}/approve`, { method: 'PATCH' });
}

export function rejectAdminUser(id: string, reason: string) {
  return request<AdminUser>(`${userPath(id)}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function requestAdminUserCorrection(id: string, reason: string) {
  return request<AdminUser>(`${userPath(id)}/request-correction`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function suspendAdminUser(id: string, reason: string) {
  return request<AdminUser>(`${userPath(id)}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function reactivateAdminUser(id: string) {
  return request<AdminUser>(`${userPath(id)}/reactivate`, { method: 'PATCH' });
}
