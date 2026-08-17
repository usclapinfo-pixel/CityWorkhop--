import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '@database/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Booking } from '@modules/bookings/entities/booking.entity';

@Entity('technician_locations')
@Index(['technicianId', 'recordedAt'])
@Index(['bookingId', 'recordedAt'])
export class TechnicianLocation extends BaseEntity {
  @Column({ type: 'uuid' })
  technicianId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'technicianId' })
  technician: User;

  @Column({ type: 'uuid', nullable: true })
  bookingId?: string;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  accuracyMeters?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  speedKmh?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  headingDegrees?: number;

  @Column({ type: 'timestamp with time zone' })
  recordedAt: Date;
}
