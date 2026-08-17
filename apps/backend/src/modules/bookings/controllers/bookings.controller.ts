import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { BookingsService } from '../services/bookings.service';
import { UserRole } from '@modules/users/enums/user-role.enum';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    id?: string;
    role?: UserRole;
  };
}

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Get(':bookingId/tracking')
  @UseGuards(JwtAuthGuard)
  async getTracking(
    @Param('bookingId') bookingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.getTracking(
      bookingId,
      request.user ?? {},
    );
  }
}

