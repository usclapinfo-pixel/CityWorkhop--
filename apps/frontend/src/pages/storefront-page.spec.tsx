import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { AuthProvider } from '../store/auth-context';
import { StorefrontPage } from './storefront-page';

const cities = [{ id: 'city-1', name: 'Bareilly', state: 'UP', district: 'Bareilly' }];
const appliances = [{ id: 'appliance-1', name: 'AC', code: 'AC', isActive: true, displayOrder: 0, category: 'Cooling' }];
const services = [{
  id: 'service-1', applianceTypeId: 'appliance-1', serviceCategoryId: 'category-1', name: 'AC Repair', code: 'AC_REPAIR',
  isActive: true, displayOrder: 0, requiresInspection: true, estimatedDurationMinutes: 45,
  serviceCategory: { id: 'category-1', name: 'Repair', code: 'REPAIR' },
}];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function mockFetch(overrides: Partial<Record<'cities' | 'appliances' | 'services', () => Response | Promise<Response>>> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/auth/me')) return jsonResponse({ user: JSON.parse(sessionStorage.getItem('cityworkshop.user') ?? 'null') });
    if (url.includes('/catalog/cities')) return overrides.cities ? overrides.cities() : jsonResponse(cities);
    if (url.includes('/services?')) return overrides.services ? overrides.services() : jsonResponse(services);
    if (url.includes('/catalog/appliances')) return overrides.appliances ? overrides.appliances() : jsonResponse(appliances);
    throw new Error(`Unexpected fetch call: ${url}`);
  });
}

function renderStorefront(initialEntries: string[] = ['/']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<StorefrontPage />} />
          <Route path="/login" element={<span>LOGIN_SCREEN</span>} />
          <Route path="/booking/continue" element={<span>BOOKING_CONTINUE_SCREEN</span>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

test('guest can open the storefront without authentication', async () => {
  vi.stubGlobal('fetch', mockFetch());
  renderStorefront();
  expect(screen.getByRole('heading', { name: /Browse appliance repair/i })).toBeInTheDocument();
  expect(sessionStorage.getItem('cityworkshop.accessToken')).toBeNull();
});

test('loads the appliance list', async () => {
  vi.stubGlobal('fetch', mockFetch());
  renderStorefront();
  expect(await screen.findByText('AC')).toBeInTheDocument();
});

test('selecting an appliance loads its services for the active city', async () => {
  vi.stubGlobal('fetch', mockFetch());
  renderStorefront();
  await userEvent.click(await screen.findByText('AC'));
  expect(await screen.findByText('AC Repair')).toBeInTheDocument();
});

test('shows a loading state while appliances are being fetched', async () => {
  let resolveAppliances: (value: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => { resolveAppliances = resolve; });
  vi.stubGlobal('fetch', mockFetch({ appliances: () => pending }));
  renderStorefront();
  expect(screen.getByText('Loading appliances')).toBeInTheDocument();
  resolveAppliances(jsonResponse(appliances));
  await screen.findByText('AC');
});

test('shows an empty state when no appliances are returned', async () => {
  vi.stubGlobal('fetch', mockFetch({ appliances: () => jsonResponse([]) }));
  renderStorefront();
  expect(await screen.findByText('No appliances found')).toBeInTheDocument();
});

test('shows an API error state and recovers via retry', async () => {
  let attempt = 0;
  vi.stubGlobal('fetch', mockFetch({
    appliances: () => { attempt += 1; return attempt === 1 ? jsonResponse({ message: 'Service unavailable' }, 500) : jsonResponse(appliances); },
  }));
  renderStorefront();
  expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('AC')).toBeInTheDocument();
});

test('guest clicking Book Service is sent to login, not a booking API', async () => {
  const fetchMock = mockFetch();
  vi.stubGlobal('fetch', fetchMock);
  renderStorefront();
  await userEvent.click(await screen.findByText('AC'));
  await userEvent.click(await screen.findByText('AC Repair'));
  await userEvent.click(screen.getByRole('button', { name: 'Book Service' }));
  expect(await screen.findByText('LOGIN_SCREEN')).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([input]) => /booking|order/i.test(String(input)))).toBe(false);
});

test('authenticated customer clicking Book Service skips login and reaches booking continuation', async () => {
  sessionStorage.setItem('cityworkshop.accessToken', 'test-token');
  sessionStorage.setItem('cityworkshop.user', JSON.stringify({ id: 'customer-1', role: 'CUSTOMER' }));
  const fetchMock = mockFetch();
  vi.stubGlobal('fetch', fetchMock);
  renderStorefront();
  await userEvent.click(await screen.findByText('AC'));
  await userEvent.click(await screen.findByText('AC Repair'));
  await userEvent.click(screen.getByRole('button', { name: 'Book Service' }));
  expect(await screen.findByText('BOOKING_CONTINUE_SCREEN')).toBeInTheDocument();
  expect(fetchMock.mock.calls.some(([input]) => /booking|order/i.test(String(input)))).toBe(false);
});
