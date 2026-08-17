export interface TechnicianLocationUpdate {
  bookingId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  speedKmh?: number;
  headingDegrees?: number;
  recordedAt: string | Date;
  distanceMeters?: number;
  distanceText?: string;
  durationSeconds?: number;
  durationText?: string;
  mapsProvider?: 'mock' | 'google';
  encodedPolyline?: string;
}

export interface TrackingConnectionResult {
  success: boolean;
  room: string;
  bookingId: string;
}
