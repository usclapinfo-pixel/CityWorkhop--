import {
  Column,
  Entity,
  Index,
} from 'typeorm';
import { BaseEntity } from '@database/base.entity';

export enum MapsProvider {
  MOCK = 'mock',
  GOOGLE = 'google',
}

@Entity('maps_config')
@Index(['isActive'])
export class MapsConfig extends BaseEntity {
  @Column({
    type: 'enum',
    enum: MapsProvider,
    default: MapsProvider.MOCK,
  })
  provider: MapsProvider;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  browserApiKey?: string;

  @Column({ type: 'text', nullable: true })
  routesApiKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mapId?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;
}
