export interface MapsRouteRequest {
  origin: {
    latitude: number;
    longitude: number;
  };

  destination: {
    latitude: number;
    longitude: number;
  };

  departureTime?: Date;
}

export interface MapsRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  durationText: string;
  distanceText: string;
  encodedPolyline?: string;
  provider: 'mock' | 'google';
}
