import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async getTracking(
    bookingId: string,
    user: {
      sub?: string;
      id?: string;
      role?: UserRole;
    },
  ) {
    const userId = user.sub ?? user.id;

    if (!userId) {
      throw new ForbiddenException('Authenticated user is required');
    }

    const booking = await this.bookingRepository.findOne({
      where: {
        id: bookingId,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isCustomer =
      user.role === UserRole.CUSTOMER &&
      booking.customerId === userId;

    const isTechnician =
      user.role === UserRole.TECHNICIAN &&
      booking.technicianId === userId;

    const isAdmin =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CITY_ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    if (!isCustomer && !isTechnician && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to access this booking',
      );
    }

    return {
      id: booking.id,
      status: booking.status,
      customerId: booking.customerId,
      technicianId: booking.technicianId,
      serviceAddress: booking.serviceAddress,
      addressLine2: booking.addressLine2,
      landmark: booking.landmark,
      pincode: booking.pincode,
      latitude: Number(booking.latitude),
      longitude: Number(booking.longitude),
      requiresInspection: booking.requiresInspection,
      scheduledAt: booking.scheduledAt,
      assignedAt: booking.assignedAt,
      acceptedAt: booking.acceptedAt,
      arrivedAt: booking.arrivedAt,
      completedAt: booking.completedAt,
    };
  }
}
