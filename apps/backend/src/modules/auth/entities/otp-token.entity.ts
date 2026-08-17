import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@database/base.entity';

/**
 * OTP Token Entity - Manages one-time passwords for authentication
 * Supports SMS OTP and WhatsApp OTP flows
 * Prevents brute-force via attempt tracking
 */
@Entity('otp_tokens')
@Index(['phoneNumber', 'status'])
@Index(['email', 'status'])
@Index(['expiresAt'])
export class OTPToken extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phoneNumber?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email?: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  otpHash: string; // Hashed OTP code (never store plain)

  @Column({
    type: 'varchar',
    length: 255,
  })
  otpToken: string; // Reference token (what user receives)

  @Column({
    type: 'enum',
    enum: ['pending', 'verified', 'expired', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'verified' | 'expired' | 'failed';

  @Column({
    type: 'int',
    default: 0,
  })
  attempts: number; // Failed verification attempts

  @Column({
    type: 'varchar',
    length: 20,
    default: 'sms',
  })
  channel: 'sms' | 'whatsapp' | 'email'; // Delivery channel
  @Column({
    type: 'enum',
    enum: ['REGISTRATION', 'LOGIN'],
    nullable: true,
  })
  purpose?: 'REGISTRATION' | 'LOGIN'; // OTP purpose

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt?: Date;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipAddress?: string; // For security audit

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  metadata?: Record<string, any>; // Language, provider used, etc.
}
