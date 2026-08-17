export interface AuditLogRecord {
  id: string;
  eventType: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorRole?: string;
  email?: string;
  phoneNumber?: string;
  description?: string;
  changes?: unknown;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  errorMessage?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  eventType?: string;
  actorId?: string;
  targetUserId?: string;
  cityId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface AuditLogPage {
  records: AuditLogRecord[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
