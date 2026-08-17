import { request } from './api-client';
import type { KycRecord } from '../types/admin';

export interface KycDocumentAccess {
  accessUrl: string;
  expiresIn: number;
  contentType?: string;
}

const userPath = (userId: string) => `/api/v1/admin/users/${encodeURIComponent(userId)}`;

export function getKycRecords(userId: string) {
  return request<KycRecord[]>(`${userPath(userId)}/kyc`);
}

export function getKycDocumentAccess(userId: string, recordId: string) {
  return request<KycDocumentAccess>(`${userPath(userId)}/kyc/${encodeURIComponent(recordId)}/access`);
}
