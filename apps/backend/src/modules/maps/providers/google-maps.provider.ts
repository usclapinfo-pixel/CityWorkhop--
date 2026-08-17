import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  MapsRouteRequest,
  MapsRouteResult,
} from '../dto/maps-route.dto';
import { MapsProvider } from './maps-provider.interface';

@Injectable()
export class GoogleMapsProvider implements MapsProvider {
  async calculateRoute(
    request: MapsRouteRequest,
    configuredApiKey?: string,
  ): Promise<MapsRouteResult> {
    const apiKey =
      configuredApiKey?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Google Maps Routes API key is not configured',
      );
    }

    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: request.origin.latitude,
                longitude: request.origin.longitude,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: request.destination.latitude,
                longitude: request.destination.longitude,
              },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new ServiceUnavailableException(
        `Google Maps Routes API request failed: ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: {
          encodedPolyline?: string;
        };
      }>;
    };

    const route = data.routes?.[0];

    if (!route) {
      throw new ServiceUnavailableException(
        'Google Maps returned no route',
      );
    }

    const distanceMeters = Number(route.distanceMeters ?? 0);
    const durationSeconds = this.parseDuration(
      route.duration ?? '0s',
    );

    return {
      distanceMeters,
      durationSeconds,
      distanceText: this.formatDistance(distanceMeters),
      durationText: this.formatDuration(durationSeconds),
      encodedPolyline:
        route.polyline?.encodedPolyline,
      provider: 'google',
    };
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^([\d.]+)s$/);

    if (!match) {
      return 0;
    }

    return Math.round(Number(match[1]));
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
