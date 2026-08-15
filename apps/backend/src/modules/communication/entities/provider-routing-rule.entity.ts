import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { CommunicationChannel } from '../interfaces/provider.interface';

@Entity('provider_routing_rules')
@Index(['cityId', 'channel', 'isActive'])
@Index(['providerType'])
export class ProviderRoutingRule extends BaseEntity {
  @Column({
    type: 'uuid',
    nullable: true,
  })
  cityId?: string;

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
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  moduleName?: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  priority: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  allowFallback: boolean;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  metadata?: Record<string, any>;
}
