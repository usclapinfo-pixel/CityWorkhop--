import {
  MapsRouteRequest,
  MapsRouteResult,
} from '../dto/maps-route.dto';

export interface MapsProvider {
  calculateRoute(
    request: MapsRouteRequest,
  ): Promise<MapsRouteResult>;
}
