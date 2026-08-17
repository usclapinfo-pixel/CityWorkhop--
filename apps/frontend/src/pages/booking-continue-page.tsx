import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '../services/api-client';
import { getAppliances, getServicesForAppliance } from '../services/catalog-service';
import type { ApplianceType, ServiceOffering } from '../types/catalog';
import { Button, Card, ErrorState, Loading } from '../components/ui';
import { useAuth } from '../store/auth-context';
import '../styles/storefront.css';

export function BookingContinuePage() {
  const [searchParams] = useSearchParams();
  const applianceId = searchParams.get('applianceId') ?? '';
  const serviceId = searchParams.get('serviceId') ?? '';
  const cityId = searchParams.get('cityId') ?? '';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appliance, setAppliance] = useState<ApplianceType | null>(null);
  const [service, setService] = useState<ServiceOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!applianceId || !serviceId || !cityId) {
      setError('Your selected service could not be found. Please choose a service again.');
      setLoading(false);
      return;
    }
    setLoading(true); setError('');
    try {
      const [appliances, services] = await Promise.all([getAppliances(), getServicesForAppliance(applianceId, cityId)]);
      setAppliance(appliances.find((item) => item.id === applianceId) ?? null);
      setService(services.find((item) => item.id === serviceId) ?? null);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : 'Unable to load your selected service.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, [applianceId, serviceId, cityId]);

  if (loading) return <Loading label="Loading your selection" />;
  if (error) return <div className="page-stack"><ErrorState message={error} /><Button onClick={() => navigate('/')}>Back to storefront</Button></div>;
  if (!appliance || !service) return <div className="page-stack"><ErrorState message="This service is no longer available. Please choose another service." /><Button onClick={() => navigate('/')}>Back to storefront</Button></div>;

  return (
    <div className="storefront-page">
      <div className="eyebrow">CONTINUE BOOKING</div>
      <h1>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</h1>
      <Card className="storefront-details">
        <div className="section-label">SELECTED SERVICE</div>
        <h2>{service.name}</h2>
        <p className="muted">{appliance.name}{service.description ? ` — ${service.description}` : ''}</p>
        <p>You&apos;re signed in. Booking submission will be available in a future release.</p>
        <Button disabled>Continue Booking (coming soon)</Button>
      </Card>
    </div>
  );
}
