import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';

@Entity('appliance_types')
@Unique(['code'])
@Index(['isActive'])
@Index(['displayOrder'])
export class ApplianceType extends BaseEntity {
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'varchar', length: 100 }) code: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) category?: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) iconReference?: string;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) displayOrder: number;
}
