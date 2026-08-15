import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogInput {
  eventType: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout' | 'otp_request' | 'otp_verify';
  entityType?: string;
  entityId?: string;
  userId?: string;
  userRole?: string;
  email?: string;
  phoneNumber?: string;
  description?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Audit Service - Logs all sensitive actions for compliance & security
 * Every auth event (registration, login, OTP) is logged
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput): Promise<AuditLog> {
    const auditLog = this.auditRepository.create(input);
    return this.auditRepository.save(auditLog);
  }

  async getByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async getByEventType(eventType: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getSecurityEvents(daysBefore: number = 7): Promise<AuditLog[]> {
    const date = new Date();
    date.setDate(date.getDate() - daysBefore);

    return this.auditRepository.find({
      where: [
        { severity: 'high', createdAt: { $gte: date } as any },
        { severity: 'critical', createdAt: { $gte: date } as any },
      ],
      order: { createdAt: 'DESC' },
    });
  }
}
