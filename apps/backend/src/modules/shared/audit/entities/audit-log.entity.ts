import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@database/base.entity';

/**
 * Audit Log Entity - Tracks all sensitive actions
 * Used for compliance, security investigation, and access tracking
 */
@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['eventType'])
export class AuditLog extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  eventType: string; // e.g., 'auth.register', 'auth.login', 'auth.otp_sent', 'auth.otp_verified'

  @Column({
    type: 'varchar',
    length: 50,
  })
  action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout' | 'otp_request' | 'otp_verify';

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  entityType?: string; // 'User', 'OTPToken', etc.

  @Column({
    type: 'uuid',
    nullable: true,
  })
  entityId?: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  userId?: string; // Who performed the action (null for anonymous)

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  userRole?: string; // Role at time of action

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email?: string; // For auth events

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phoneNumber?: string; // For auth events

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  changes?: Record<string, any>; // What changed (old vs new values)

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipAddress?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  userAgent?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  status: 'success' | 'failure' | 'warning' | null; // Action outcome

  @Column({
    type: 'text',
    nullable: true,
  })
  errorMessage?: string; // If status = failure

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  severity: 'low' | 'medium' | 'high' | 'critical' | null; // Security severity

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  metadata?: Record<string, any>; // Additional context
}
