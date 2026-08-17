import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TechnicianLocation } from '../entities/technician-location.entity';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Booking } from '@modules/bookings/entities/booking.entity';
import { BookingStatus } from '@modules/bookings/enums/booking-status.enum';
import { TrackingGateway } from '../gateways/tracking.gateway';
import { MapsService } from '@modules/maps/services/maps.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TechnicianLocation)
    private readonly locationRepository: Repository<TechnicianLocation>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    private readonly trackingGateway: TrackingGateway,

    private readonly mapsService: MapsService,
  ) {}

  async updateTechnicianLocation(
    technicianId: string,
    dto: UpdateLocationDto,
    bookingId?: string,
  ): Promise<TechnicianLocation> {
    let booking: Booking | null = null;

    if (bookingId) {
      booking = await this.bookingRepository.findOne({
        where: {
          id: bookingId,
          technicianId,
        },
      });

      if (!booking) {
        throw new NotFoundException(
          'Active booking was not found for this technician',
        );
      }

      const trackableStatuses = [
        BookingStatus.TECHNICIAN_ACCEPTED,
        BookingStatus.EN_ROUTE,
        BookingStatus.ARRIVED,
        BookingStatus.INSPECTION,
        BookingStatus.QUOTE_PENDING,
        BookingStatus.QUOTE_ACCEPTED,
        BookingStatus.IN_PROGRESS,
      ];

      if (!trackableStatuses.includes(booking.status)) {
        throw new ForbiddenException(
          'Live location is not allowed for the current booking status',
        );
      }
    }

    const location = this.locationRepository.create({
      technicianId,
      bookingId: booking?.id,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyMeters: dto.accuracyMeters,
      speedKmh: dto.speedKmh,
      headingDegrees: dto.headingDegrees,
      recordedAt: new Date(),
    });

    const savedLocation =
      await this.locationRepository.save(location);

    if (booking?.id) {
      const route = await this.mapsService.calculateRoute({
        origin: {
          latitude: Number(savedLocation.latitude),
          longitude: Number(savedLocation.longitude),
        },
        destination: {
          latitude: Number(booking.latitude),
          longitude: Number(booking.longitude),
        },
      });

      this.trackingGateway.broadcastTechnicianLocation(
        booking.id,
        {
          latitude: Number(savedLocation.latitude),
          longitude: Number(savedLocation.longitude),
          accuracyMeters: savedLocation.accuracyMeters
            ? Number(savedLocation.accuracyMeters)
            : undefined,
          speedKmh: savedLocation.speedKmh
            ? Number(savedLocation.speedKmh)
            : undefined,
          headingDegrees: savedLocation.headingDegrees
            ? Number(savedLocation.headingDegrees)
            : undefined,
          recordedAt: savedLocation.recordedAt,

          distanceMeters: route.distanceMeters,
          distanceText: route.distanceText,
          durationSeconds: route.durationSeconds,
          durationText: route.durationText,
          mapsProvider: route.provider,
          encodedPolyline: route.encodedPolyline,
        },
      );
    }

    return savedLocation;
  }
}
