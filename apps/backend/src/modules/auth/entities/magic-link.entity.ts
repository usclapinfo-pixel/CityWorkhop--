import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@database/base.entity';

/**
 * Magic Link Entity - Manages email magic link authentication
 * Alternative to OTP for email-based login/registration
 * One-time use tokens with expiration
 */
@Entity('magic_links')
@Index(['email', 'status'])
@Index(['token'])
@Index(['expiresAt'])
export class MagicLink extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  token: string; // Hashed token stored in DB

  @Column({
    type: 'varchar',
    length: 255,
  })
  tokenReference: string; // Public reference sent in email

  @Column({
    type: 'enum',
    enum: ['active', 'used', 'expired', 'revoked'],
    default: 'active',
  })
  status: 'active' | 'used' | 'expired' | 'revoked';

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  usedAt?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  userId?: string; // If linking to existing user

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
  metadata?: Record<string, any>; // Flow type, user-agent, etc.
}
