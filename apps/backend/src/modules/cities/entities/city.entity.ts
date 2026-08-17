import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';

@Entity('cities')
@Unique(['code'])
@Index(['isActive'])
@Index(['state', 'district'])
export class City extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  state: string;

  @Column({ type: 'varchar', length: 255 })
  district: string;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
