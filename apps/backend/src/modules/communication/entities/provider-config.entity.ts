import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { CommunicationChannel } from '../interfaces/provider.interface';

/**
 * Provider Configuration Entity - Database-first provider setup
 * Supports:
 * - MSG91 (OTP, WhatsApp, SMS)
 * - Local WhatsApp
 * - WhatsApp Business API
 * - Manual provider (admin-managed)
 *
 * City-scoped: Different cities can use different providers
 * Priority-based: Fallback to next provider if primary fails
 */
@Entity('provider_configs')
@Index(['cityId', 'providerType', 'isActive'])
@Index(['priority'])
@Unique(['cityId', 'providerType', 'channel'])
export class ProviderConfig extends BaseEntity {
  @Column({
    type: 'uuid',
    nullable: true,
  })
  cityId?: string; // null = global default

  @Column({
    type: 'varchar',
    length: 50,
  })
  providerType:
    | 'MSG91'
    | 'WHATSAPP'
    | 'LOCAL_WHATSAPP'
    | 'LOCAL_WHATSAPP_API'
    | 'WHATSAPP_BUSINESS_API'
    | 'N8N'
    | 'MANUAL'
    | 'TWILIO'
    | 'SENDGRID';

  @Column({
    type: 'varchar',
    length: 20,
  })
  channel: CommunicationChannel;

  @Column({
    type: 'boolean',
    default: false,
  })
  isActive: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  priority: number; // 0 = highest priority (primary), 1+ = fallback

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
  })
  credentials: Record<string, any>;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
  })
  features: Record<string, any>;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
  })
  retryPolicy: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastTestedAt?: Date;

  @Column({
    type: 'boolean',
    default: true,
  })
  lastTestSuccess: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  createdByAdminId?: string;
}
