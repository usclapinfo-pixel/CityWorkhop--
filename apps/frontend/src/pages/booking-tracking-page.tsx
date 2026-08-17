import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Loading,
} from '../components/ui';
import { trackingSocket } from '../services/tracking-socket-service';
import { getBookingTracking } from '../services/booking-service';
import type { BookingTracking } from '../services/booking-service';
import { TrackingMap } from '../components/maps/tracking-map';
import type { TechnicianLocationUpdate } from '../types/tracking';
import '../styles/storefront.css';

export function BookingTrackingPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] =
    useState<TechnicianLocationUpdate | null>(null);

  const [booking, setBooking] =
    useState<BookingTracking | null>(null);
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID is missing.');
      setJoining(false);
      return;
    }

    let active = true;
    let removeLocationListener: (() => void) | undefined;

    async function startTracking() {
      try {
        setJoining(true);
        setError('');

        const bookingDetails = await getBookingTracking(bookingId);

        if (!active) return;

        setBooking(bookingDetails);

        const socket = trackingSocket.connect();

        socket.on('connect', () => {
          if (active) {
            setConnected(true);
          }
        });

        socket.on('disconnect', () => {
          if (active) {
            setConnected(false);
          }
        });

        socket.on('connect_error', (reason) => {
          if (active) {
            setConnected(false);
            setError(
              reason instanceof Error
                ? reason.message
                : 'Unable to connect to live tracking.',
            );
          }
        });

        await trackingSocket.joinBooking(bookingId);

        if (!active) return;

        removeLocationListener =
          trackingSocket.onTechnicianLocation(
            (nextLocation) => {
              if (active) {
                setLocation(nextLocation);
              }
            },
          );

        setConnected(true);
        setJoining(false);
      } catch (reason) {
        if (!active) return;

        setJoining(false);
        setConnected(false);
        setError(
          reason instanceof Error
            ? reason.message
            : 'Unable to start live tracking.',
        );
      }
    }

    void startTracking();

    return () => {
      active = false;
      removeLocationListener?.();
      trackingSocket.disconnect();
    };
  }, [bookingId]);

  if (joining) {
    return (
      <Loading label="Connecting to live technician tracking..." />
    );
  }

  return (
    <div className="storefront-page">
      <div className="storefront-header">
        <div>
          <div className="eyebrow">LIVE SERVICE TRACKING</div>
          <h1>Your technician is on the way</h1>
          <p className="muted">
            Booking ID: {bookingId}
          </p>
        </div>

        <Badge tone={connected ? 'success' : 'warning'}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </Badge>
      </div>

      {error && <ErrorState message={error} />}

      <Card className="storefront-details">
        <div className="section-label">
          LIVE MAP
        </div>

        <TrackingMap
          technicianLocation={location}
          customerLatitude={booking?.latitude}
          customerLongitude={booking?.longitude}
        />
      </Card>

      <Card className="storefront-details">
        <div className="section-label">
          TECHNICIAN LOCATION
        </div>

        {location ? (
          <>
            <h2>
              {location.distanceText ??
                'Calculating distance...'}
            </h2>

            <p className="muted">
              Estimated arrival:{' '}
              {location.durationText ??
                'Calculating ETA...'}
            </p>

            <div className="storefront-detail-facts">
              <span>
                Latitude: {location.latitude.toFixed(6)}
              </span>
              <span>
                Longitude: {location.longitude.toFixed(6)}
              </span>

              {location.speedKmh !== undefined && (
                <span>
                  Speed: {location.speedKmh.toFixed(1)} km/h
                </span>
              )}

              {location.accuracyMeters !== undefined && (
                <span>
                  GPS accuracy:{' '}
                  {location.accuracyMeters.toFixed(0)} m
                </span>
              )}
            </div>

            <Badge
              tone={
                location.mapsProvider === 'google'
                  ? 'accent'
                  : 'neutral'
              }
            >
              Maps: {location.mapsProvider ?? 'unknown'}
            </Badge>
          </>
        ) : (
          <>
            <h2>Waiting for technician location</h2>
            <p className="muted">
              The technician&apos;s live location will appear
              here as soon as tracking starts.
            </p>
          </>
        )}
      </Card>

      <Card>
        <div className="section-label">
          LIVE COORDINATES
        </div>

        {location ? (
          <div className="storefront-detail-facts">
            <span>
              Last update:{' '}
              {new Date(
                location.recordedAt,
              ).toLocaleTimeString()}
            </span>

            {location.headingDegrees !== undefined && (
              <span>
                Heading:{' '}
                {location.headingDegrees.toFixed(0)}°
              </span>
            )}
          </div>
        ) : (
          <p className="muted">
            Waiting for the first GPS update...
          </p>
        )}
      </Card>

      <Button
        variant="quiet"
        onClick={() => navigate('/')}
      >
        Back to home
      </Button>
    </div>
  );
}






