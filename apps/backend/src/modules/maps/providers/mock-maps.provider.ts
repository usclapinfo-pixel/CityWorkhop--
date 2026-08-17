import { Injectable } from '@nestjs/common';
import {
  MapsRouteRequest,
  MapsRouteResult,
} from '../dto/maps-route.dto';
import { MapsProvider } from './maps-provider.interface';

@Injectable()
export class MockMapsProvider implements MapsProvider {
  async calculateRoute(
    request: MapsRouteRequest,
  ): Promise<MapsRouteResult> {
    const distanceMeters = this.calculateDistance(
      request.origin.latitude,
      request.origin.longitude,
      request.destination.latitude,
      request.destination.longitude,
    );

    const durationSeconds = Math.max(
      60,
      Math.round((distanceMeters / 1000 / 30) * 3600),
    );

    return {
      distanceMeters: Math.round(distanceMeters),
      durationSeconds,
      distanceText: this.formatDistance(distanceMeters),
      durationText: this.formatDuration(durationSeconds),
      provider: 'mock',
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusMeters = 6_371_000;

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) ** 2;

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      );

    return earthRadiusMeters * c;
  }

  private formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)} m`;
    }

    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  private formatDuration(durationSeconds: number): string {
    const minutes = Math.max(
      1,
      Math.round(durationSeconds / 60),
    );

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
      ? `${hours} hr ${remainingMinutes} min`
      : `${hours} hr`;
  }
}
