import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { UserRole } from '../enums/user-role.enum';
import { AccountStatus } from '../enums/account-status.enum';

/**
 * User Entity - Base entity for all user types
 * All users (customer, technician, vendor, admin, etc.) extend from this
 */
@Entity('users')
@Unique(['email'])
@Index(['email'])
@Index(['role'])
@Index(['createdAt'])
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone?: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false, // Never return password in queries
  })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING,
  })
  status: AccountStatus;

  @Column({
    type: 'boolean',
    default: false,
  })
  emailVerified: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  phoneVerified: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  kycVerified: boolean;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  isDemoAccount: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  failedLoginAttempts: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  lockedUntil?: Date;

  @Column({
    type: 'boolean',
    default: true,
  })
  allowNotifications: boolean;

  @Column({
    type: 'uuid',
    array: true,
    default: () => 'ARRAY[]::uuid[]',
  })
  authorizedCityIds: string[];

  @Column({
    type: 'uuid',
    nullable: true,
  })
  defaultCityId?: string;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  providerPreferences?: Record<string, any>;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastLoginAt?: Date;
}
