import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { CommunicationChannel } from '../interfaces/provider.interface';

@Entity('city_provider_mappings')
@Index(['cityId', 'channel'])
@Index(['providerConfigId'])
@Unique(['cityId', 'channel', 'moduleName'])
export class CityProviderMapping extends BaseEntity {
  @Column({
    type: 'uuid',
    nullable: true,
  })
  cityId?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  moduleName?: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  channel: CommunicationChannel;

  @Column({
    type: 'uuid',
  })
  providerConfigId: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  isPrimary: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  isFallback: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  priority: number;

  @Column({
    type: 'jsonb',
    default: () => "'{}'",
    nullable: true,
  })
  metadata?: Record<string, any>;
}
