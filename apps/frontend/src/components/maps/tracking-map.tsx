import { useEffect, useRef, useState } from 'react';
import {
  importLibrary,
  setOptions,
} from '@googlemaps/js-api-loader';
import type { TechnicianLocationUpdate } from '../../types/tracking';

interface TrackingMapProps {
  technicianLocation: TechnicianLocationUpdate | null;
  customerLatitude?: number;
  customerLongitude?: number;
  googleMapsApiKey?: string;
}

export function TrackingMap({
  technicianLocation,
  customerLatitude,
  customerLongitude,
  googleMapsApiKey,
}: TrackingMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const technicianMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const customerMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current) {
      return;
    }

    let cancelled = false;

    async function loadMap() {
      try {
        setOptions({
          key: googleMapsApiKey,
          v: 'weekly',
        });

        const { Map } =
          await importLibrary('maps');

        const { AdvancedMarkerElement } =
          await importLibrary('marker');

        if (cancelled || !mapElementRef.current) {
          return;
        }

        const initialLatitude =
          customerLatitude ??
          technicianLocation?.latitude ??
          28.6139;

        const initialLongitude =
          customerLongitude ??
          technicianLocation?.longitude ??
          77.2090;

        mapRef.current = new Map(
          mapElementRef.current,
          {
            center: {
              lat: Number(initialLatitude),
              lng: Number(initialLongitude),
            },
            zoom: 14,
            mapId: 'CITY_WORKSHOP_TRACKING_MAP',
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: false,
          },
        );

        if (customerLatitude !== undefined &&
            customerLongitude !== undefined) {
          const customerElement =
            document.createElement('div');

          customerElement.textContent = '📍';
          customerElement.style.fontSize = '28px';

          customerMarkerRef.current =
            new AdvancedMarkerElement({
              map: mapRef.current,
              position: {
                lat: Number(customerLatitude),
                lng: Number(customerLongitude),
              },
              title: 'Service location',
              content: customerElement,
            });
        }

        if (technicianLocation) {
          const technicianElement =
            document.createElement('div');

          technicianElement.textContent = '🚗';
          technicianElement.style.fontSize = '30px';

          technicianMarkerRef.current =
            new AdvancedMarkerElement({
              map: mapRef.current,
              position: {
                lat: Number(technicianLocation.latitude),
                lng: Number(technicianLocation.longitude),
              },
              title: 'Technician',
              content: technicianElement,
            });
        }

        setMapReady(true);
      } catch (error) {
        if (!cancelled) {
          setMapError(
            error instanceof Error
              ? error.message
              : 'Unable to load Google Maps.',
          );
        }
      }
    }

    void loadMap();

    return () => {
      cancelled = true;
      mapRef.current = null;
      technicianMarkerRef.current = null;
      customerMarkerRef.current = null;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !technicianMarkerRef.current ||
      !technicianLocation
    ) {
      return;
    }

    const position = {
      lat: Number(technicianLocation.latitude),
      lng: Number(technicianLocation.longitude),
    };

    technicianMarkerRef.current.position = position;
    mapRef.current.panTo(position);
  }, [mapReady, technicianLocation]);

  if (!googleMapsApiKey) {
    return (
      <div
        style={{
          minHeight: 360,
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          border: '1px solid var(--line)',
          background: 'var(--paper)',
          textAlign: 'center',
        }}
      >
        <div>
          <strong>
            Live map is ready for activation
          </strong>

          <p className="muted">
            Google Maps API key will be configured
            by Admin.
          </p>

          {technicianLocation && (
            <p className="muted">
              Technician:{' '}
              {Number(
                technicianLocation.latitude,
              ).toFixed(6)}
              ,{' '}
              {Number(
                technicianLocation.longitude,
              ).toFixed(6)}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        style={{
          minHeight: 360,
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          border: '1px solid var(--line)',
          background: 'var(--paper)',
        }}
      >
        <div>
          <strong>Google Maps unavailable</strong>
          <p className="muted">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapElementRef}
      style={{
        width: '100%',
        minHeight: 360,
        borderRadius: 12,
        overflow: 'hidden',
      }}
      aria-label="Live technician tracking map"
    />
  );
}
