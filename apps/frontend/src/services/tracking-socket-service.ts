import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStore } from './api-client';
import type {
  TechnicianLocationUpdate,
  TrackingConnectionResult,
} from '../types/tracking';

function getSocketBaseUrl(): string {
  const apiUrl = env.apiBaseUrl;

  if (!apiUrl) {
    return window.location.origin;
  }

  return apiUrl.replace(/\/api\/v\d+\/?$/, '');
}

export class TrackingSocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = tokenStore.get();

    if (!token) {
      throw new Error('Authentication token is missing');
    }

    this.socket = io(`${getSocketBaseUrl()}/tracking`, {
      transports: ['websocket'],
      auth: {
        token,
      },
      autoConnect: true,
    });

    return this.socket;
  }

  async joinBooking(
    bookingId: string,
  ): Promise<TrackingConnectionResult> {
    const socket = this.connect();

    return new Promise((resolve, reject) => {
      socket.emit(
        'join-booking',
        { bookingId },
        (result: TrackingConnectionResult) => {
          if (!result?.success) {
            reject(
              new Error('Unable to join booking tracking'),
            );
            return;
          }

          resolve(result);
        },
      );

      socket.once('connect_error', (error: Error) => {
        reject(error);
      });
    });
  }

  onTechnicianLocation(
    listener: (location: TechnicianLocationUpdate) => void,
  ): () => void {
    const socket = this.connect();

    socket.on('technician-location', listener);

    return () => {
      socket.off('technician-location', listener);
    };
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const trackingSocket = new TrackingSocketService();
