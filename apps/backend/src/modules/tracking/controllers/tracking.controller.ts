import {
  Body,
  Controller,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TrackingService } from '../services/tracking.service';
import { UpdateLocationDto } from '../dto/update-location.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    id?: string;
    userId?: string;
    role?: string;
  };
}

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('location')
  async updateLocation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateLocationDto,
    @Query('bookingId') bookingId?: string,
  ) {
    const technicianId =
      request.user?.sub ??
      request.user?.id ??
      request.user?.userId;

    if (!technicianId) {
      throw new UnauthorizedException('Authenticated technician is required');
    }

    return this.trackingService.updateTechnicianLocation(
      technicianId,
      dto,
      bookingId,
    );
  }
}
