import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { City } from '@modules/cities/entities/city.entity';
import { ServiceOffering } from '@modules/catalog/entities/service-offering.entity';
import { ApplianceType } from '@modules/catalog/entities/appliance-type.entity';
import { BookingStatus } from '../enums/booking-status.enum';

@Entity('bookings')
@Index(['customerId', 'createdAt'])
@Index(['technicianId', 'status'])
@Index(['cityId', 'status'])
@Index(['status'])
export class Booking extends BaseEntity {
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ type: 'uuid', nullable: true })
  technicianId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'technicianId' })
  technician?: User;

  @Column({ type: 'uuid' })
  cityId: string;

  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column({ type: 'uuid' })
  serviceOfferingId: string;

  @ManyToOne(() => ServiceOffering, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'serviceOfferingId' })
  serviceOffering: ServiceOffering;

  @Column({ type: 'uuid' })
  applianceTypeId: string;

  @ManyToOne(() => ApplianceType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'applianceTypeId' })
  applianceType: ApplianceType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'varchar', length: 500 })
  serviceAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  landmark?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'boolean', default: true })
  requiresInspection: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'text', nullable: true })
  customerNotes?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  arrivedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;
}
