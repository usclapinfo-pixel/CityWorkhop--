import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { ApplianceType } from './appliance-type.entity';
import { ServiceCategory } from './service-category.entity';

@Entity('service_offerings')
@Unique(['code'])
@Index(['serviceCategoryId', 'isActive'])
@Index(['applianceTypeId', 'isActive'])
@Index(['displayOrder'])
export class ServiceOffering extends BaseEntity {
  @Column({ type: 'uuid' }) serviceCategoryId: string;
  @ManyToOne(() => ServiceCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'serviceCategoryId' }) serviceCategory: ServiceCategory;
  @Column({ type: 'uuid' }) applianceTypeId: string;
  @ManyToOne(() => ApplianceType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'applianceTypeId' }) applianceType: ApplianceType;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'varchar', length: 100 }) code: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'boolean', default: true }) requiresInspection: boolean;
  @Column({ type: 'int', nullable: true }) estimatedDurationMinutes?: number;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) displayOrder: number;
}
