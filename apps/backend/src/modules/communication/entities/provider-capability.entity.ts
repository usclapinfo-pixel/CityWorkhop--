import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { CommunicationChannel } from '../interfaces/provider.interface';

@Entity('provider_capabilities')
@Index(['providerType', 'channel'])
export class ProviderCapability extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
  })
  providerType: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  channel: CommunicationChannel;

  @Column({
    type: 'boolean',
    default: false,
  })
  supportsOtp: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  supportsMagicLink: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  supportsWhatsApp: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  supportsWebhook: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  supportsAutomation: boolean;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  metadata?: Record<string, any>;
}
