import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';

import { Booking } from '@modules/bookings/entities/booking.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';

interface TrackingUser {
  sub: string;
  email?: string;
  role?: UserRole;
  city_ids?: string[];
}

interface AuthenticatedSocket extends Socket {
  user?: TrackingUser;
}

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: '*',
  },
})
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers.authorization?.replace(
          /^Bearer\s+/i,
          '',
        );

      if (!token) {
        client.disconnect();
        return;
      }

      const user = this.jwtService.verify<TrackingUser>(token);

      if (!user?.sub || !user?.role) {
        client.disconnect();
        return;
      }

      client.user = user;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join-booking')
  async handleJoinBooking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { bookingId: string },
  ) {
    const user = client.user;

    if (!user?.sub || !user.role) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!data?.bookingId) {
      return {
        success: false,
        message: 'bookingId is required',
      };
    }

    const booking = await this.bookingRepository.findOne({
      where: {
        id: data.bookingId,
      },
    });

    if (!booking) {
      throw new ForbiddenException('Booking access denied');
    }

    const isCustomer =
      user.role === UserRole.CUSTOMER &&
      booking.customerId === user.sub;

    const isTechnician =
      user.role === UserRole.TECHNICIAN &&
      booking.technicianId === user.sub;

    const isAdmin =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CITY_ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    if (!isCustomer && !isTechnician && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to access this booking tracking',
      );
    }

    const room = `booking:${booking.id}`;

    client.join(room);

    return {
      success: true,
      room,
      bookingId: booking.id,
    };
  }

  broadcastTechnicianLocation(
    bookingId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
      speedKmh?: number;
      headingDegrees?: number;
      recordedAt: Date;
      distanceMeters?: number;
      distanceText?: string;
      durationSeconds?: number;
      durationText?: string;
      mapsProvider?: 'mock' | 'google';
      encodedPolyline?: string;
    },
  ) {
    this.server
      .to(`booking:${bookingId}`)
      .emit('technician-location', {
        bookingId,
        ...location,
      });
  }
}

