import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  MapsRouteRequest,
  MapsRouteResult,
} from '../dto/maps-route.dto';
import { MockMapsProvider } from '../providers/mock-maps.provider';
import { GoogleMapsProvider } from '../providers/google-maps.provider';
import { MapsConfigService } from './maps-config.service';
import { MapsProvider } from '../entities/maps-config.entity';

@Injectable()
export class MapsService {
  constructor(
    private readonly mockMapsProvider: MockMapsProvider,
    private readonly googleMapsProvider: GoogleMapsProvider,
    private readonly mapsConfigService: MapsConfigService,
  ) {}

  async calculateRoute(
    request: MapsRouteRequest,
  ): Promise<MapsRouteResult> {
    const config =
      await this.mapsConfigService.getOrCreateActiveConfig();

    if (!config.isActive) {
      return this.mockMapsProvider.calculateRoute(request);
    }

    switch (config.provider) {
      case MapsProvider.MOCK:
        return this.mockMapsProvider.calculateRoute(request);

      case MapsProvider.GOOGLE:
        return this.googleMapsProvider.calculateRoute(
          request,
          config.routesApiKey,
        );

      default:
        throw new ServiceUnavailableException(
          `Unsupported Maps provider: ${config.provider}`,
        );
    }
  }
}
