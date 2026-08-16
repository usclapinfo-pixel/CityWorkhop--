import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';

@Entity('service_categories')
@Unique(['code'])
@Index(['isActive'])
@Index(['displayOrder'])
export class ServiceCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'varchar', length: 100 }) code: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) displayOrder: number;
}
