import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { City } from '@modules/cities/entities/city.entity';
import { ServiceOffering } from './service-offering.entity';

@Entity('city_service_offerings')
@Unique(['cityId', 'serviceOfferingId'])
@Index(['cityId', 'isActive'])
@Index(['serviceOfferingId', 'isActive'])
export class CityServiceOffering extends BaseEntity {
  @Column({ type: 'uuid' }) cityId: string;
  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cityId' }) city: City;
  @Column({ type: 'uuid' }) serviceOfferingId: string;
  @ManyToOne(() => ServiceOffering, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'serviceOfferingId' }) serviceOffering: ServiceOffering;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) displayOrder: number;
}
