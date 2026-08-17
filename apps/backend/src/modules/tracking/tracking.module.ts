import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TechnicianLocation } from './entities/technician-location.entity';
import { TrackingService } from './services/tracking.service';
import { TrackingController } from './controllers/tracking.controller';
import { TrackingGateway } from './gateways/tracking.gateway';

import { Booking } from '@modules/bookings/entities/booking.entity';
import { AuthModule } from '@modules/auth/auth.module';
import { MapsModule } from '@modules/maps/maps.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TechnicianLocation,
      Booking,
    ]),
    AuthModule,
    MapsModule,
  ],
  controllers: [
    TrackingController,
  ],
  providers: [
    TrackingService,
    TrackingGateway,
  ],
  exports: [
    TrackingService,
    TrackingGateway,
  ],
})
export class TrackingModule {}
