import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { AuthProvider } from '../store/auth-context';
import { BookingContinuePage } from './booking-continue-page';

const appliances = [{ id: 'appliance-1', name: 'AC', code: 'AC', isActive: true, displayOrder: 0 }];
const services = [{
  id: 'service-1', applianceTypeId: 'appliance-1', serviceCategoryId: 'category-1', name: 'AC Repair', code: 'AC_REPAIR',
  isActive: true, displayOrder: 0, requiresInspection: true, description: 'Full diagnostic and repair',
}];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/services?')) return jsonResponse(services);
    if (url.includes('/catalog/appliances')) return jsonResponse(appliances);
    throw new Error(`Unexpected fetch call: ${url}`);
  });
}

function renderPage(query: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/booking/continue?${query}`]}>
        <Routes><Route path="/booking/continue" element={<BookingContinuePage />} /></Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

test('shows the preserved selected service without sending a booking request', async () => {
  const fetchMock = mockFetch();
  vi.stubGlobal('fetch', fetchMock);
  renderPage('applianceId=appliance-1&serviceId=service-1&cityId=city-1');
  expect(await screen.findByText('AC Repair')).toBeInTheDocument();
  expect(screen.getByText(/^AC\s*—\s*Full diagnostic and repair$/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Continue Booking/i })).toBeDisabled();
  expect(fetchMock.mock.calls.some(([input]) => /booking|order/i.test(String(input)))).toBe(false);
});

test('shows a recovery message when no selection is present in the URL', async () => {
  vi.stubGlobal('fetch', mockFetch());
  renderPage('');
  expect(await screen.findByText(/could not be found/i)).toBeInTheDocument();
});
