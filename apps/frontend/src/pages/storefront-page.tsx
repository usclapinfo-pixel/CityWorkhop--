import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError } from '../services/api-client';
import { getAppliances, getPublicCities, getServicesForAppliance } from '../services/catalog-service';
import type { ApplianceType, PublicCity, ServiceOffering } from '../types/catalog';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, Select } from '../components/ui';
import { useAuth } from '../store/auth-context';
import '../styles/storefront.css';

const GUEST_CITY_KEY = 'cityworkshop.guestCityId';

export function StorefrontPage() {
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState('');
  const [cityId, setCityId] = useState(() => sessionStorage.getItem(GUEST_CITY_KEY) ?? '');

  const [appliances, setAppliances] = useState<ApplianceType[]>([]);
  const [appliancesLoading, setAppliancesLoading] = useState(true);
  const [appliancesError, setAppliancesError] = useState('');
  const [search, setSearch] = useState('');

  const [applianceId, setApplianceId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');

  const [serviceId, setServiceId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function loadCities() {
    setCitiesLoading(true); setCitiesError('');
    try {
      const result = await getPublicCities();
      setCities(result);
      const stored = sessionStorage.getItem(GUEST_CITY_KEY);
      const stillValid = stored && result.some((city) => city.id === stored);
      if (!stillValid && result.length > 0) {
        setCityId(result[0].id);
        sessionStorage.setItem(GUEST_CITY_KEY, result[0].id);
      } else if (!result.length) {
        setCityId('');
      }
    } catch (reason) {
      setCitiesError(reason instanceof ApiClientError ? reason.message : 'Unable to load cities.');
    } finally {
      setCitiesLoading(false);
    }
  }

  async function loadAppliances() {
    setAppliancesLoading(true); setAppliancesError('');
    try { setAppliances(await getAppliances()); }
    catch (reason) { setAppliancesError(reason instanceof ApiClientError ? reason.message : 'Unable to load appliances.'); }
    finally { setAppliancesLoading(false); }
  }

  async function loadServices(nextApplianceId: string, nextCityId: string) {
    setServicesLoading(true); setServicesError(''); setServices([]);
    try { setServices(await getServicesForAppliance(nextApplianceId, nextCityId)); }
    catch (reason) { setServicesError(reason instanceof ApiClientError ? reason.message : 'Unable to load services.'); }
    finally { setServicesLoading(false); }
  }

  useEffect(() => { void loadCities(); void loadAppliances(); }, []);

  function selectCity(nextCityId: string) {
    setCityId(nextCityId);
    sessionStorage.setItem(GUEST_CITY_KEY, nextCityId);
    if (applianceId) void loadServices(applianceId, nextCityId);
  }

  function selectAppliance(id: string) {
    setApplianceId(id);
    setServiceId(null);
    if (cityId) void loadServices(id, cityId);
  }

  function selectService(id: string) {
    setServiceId(id);
  }

  function handleBookService() {
    if (!applianceId || !serviceId || !cityId) return;
    const query = new URLSearchParams({ applianceId, serviceId, cityId }).toString();
    const target = `/booking/continue?${query}`;
    if (isAuthenticated) navigate(target);
    else navigate('/login', { state: { from: target } });
  }

  const visibleAppliances = appliances.filter((appliance) => appliance.name.toLowerCase().includes(search.trim().toLowerCase()));
  const selectedAppliance = appliances.find((appliance) => appliance.id === applianceId) ?? null;
  const selectedService = services.find((service) => service.id === serviceId) ?? null;

  return (
    <div className="storefront-page">
      <header className="storefront-header">
        <div>
          <div className="eyebrow">CITY WORKSHOP</div>
          <h1>Browse appliance repair &amp; services</h1>
          <p className="muted">Explore available appliances and services in your city. No sign-in required to browse.</p>
        </div>
        <div className="storefront-city">
          <label htmlFor="storefront-city-select">City</label>
          {citiesLoading ? (
            <Loading label="Loading cities" />
          ) : citiesError ? (
            <div className="storefront-city-error"><span>{citiesError}</span><Button variant="quiet" onClick={() => void loadCities()}>Retry</Button></div>
          ) : cities.length === 0 ? (
            <span className="muted">No cities available yet.</span>
          ) : (
            <Select id="storefront-city-select" aria-label="City" value={cityId} onChange={(event) => selectCity(event.target.value)}>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.state}</option>)}
            </Select>
          )}
        </div>
      </header>

      <Card className="storefront-search">
        <Input aria-label="Search appliances" placeholder="Search appliances (e.g. AC, Washing Machine)" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Card>

      <section className="storefront-section">
        <h2>Appliances</h2>
        {appliancesLoading ? (
          <Loading label="Loading appliances" />
        ) : appliancesError ? (
          <div className="page-stack"><ErrorState message={appliancesError} /><Button onClick={() => void loadAppliances()}>Retry</Button></div>
        ) : visibleAppliances.length === 0 ? (
          <EmptyState title="No appliances found" description="Try a different search term or check back later." />
        ) : (
          <div className="storefront-grid">
            {visibleAppliances.map((appliance) => (
              <button key={appliance.id} type="button" className={`storefront-card ${appliance.id === applianceId ? 'is-selected' : ''}`} onClick={() => selectAppliance(appliance.id)}>
                <strong>{appliance.name}</strong>
                {appliance.category && <small>{appliance.category}</small>}
              </button>
            ))}
          </div>
        )}
      </section>

      {applianceId && (
        <section className="storefront-section">
          <h2>Services for {selectedAppliance?.name ?? 'selected appliance'}</h2>
          {!cityId ? (
            <EmptyState title="Select a city" description="Choose a city above to see available services for this appliance." />
          ) : servicesLoading ? (
            <Loading label="Loading services" />
          ) : servicesError ? (
            <div className="page-stack"><ErrorState message={servicesError} /><Button onClick={() => void loadServices(applianceId, cityId)}>Retry</Button></div>
          ) : services.length === 0 ? (
            <EmptyState title="No services available" description="This appliance has no active services in the selected city yet." />
          ) : (
            <div className="storefront-grid">
              {services.map((service) => (
                <button key={service.id} type="button" className={`storefront-card ${service.id === serviceId ? 'is-selected' : ''}`} onClick={() => selectService(service.id)}>
                  <strong>{service.name}</strong>
                  {service.serviceCategory && <Badge tone="accent">{service.serviceCategory.name}</Badge>}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedService && (
        <Card className="storefront-details">
          <div className="section-label">SERVICE DETAILS</div>
          <h2>{selectedService.name}</h2>
          {selectedService.description && <p className="muted">{selectedService.description}</p>}
          <div className="storefront-detail-facts">
            {selectedService.estimatedDurationMinutes && <span>Estimated duration: {selectedService.estimatedDurationMinutes} min</span>}
            {selectedService.requiresInspection && <span>Requires an inspection visit</span>}
          </div>
          <Button onClick={handleBookService}>Book Service</Button>
        </Card>
      )}
    </div>
  );
}
