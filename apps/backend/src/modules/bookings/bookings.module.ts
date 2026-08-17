import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsService } from './services/bookings.service';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    AuthModule,
  ],
  controllers: [
    BookingsController,
  ],
  providers: [
    BookingsService,
  ],
  exports: [
    BookingsService,
    TypeOrmModule,
  ],
})
export class BookingsModule {}
