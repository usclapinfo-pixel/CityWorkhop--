import { request } from './api-client';
import type { AuditLogPage, AuditLogQuery, AuditLogRecord } from '../types/audit';

export function getAuditLogs(query: AuditLogQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return request<AuditLogPage>(`/api/v1/admin/audit-logs?${params.toString()}`);
}

export function getAuditLog(id: string) {
  return request<AuditLogRecord>(`/api/v1/admin/audit-logs/${encodeURIComponent(id)}`);
}
