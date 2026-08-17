import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { DashboardPage } from './dashboard-page';

afterEach(() => vi.restoreAllMocks());

test('renders real dashboard KPI and activity data', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, data: { users: { total: 12, pending: 3, approved: 1, active: 7, suspended: 1, rejected: 0, deactivated: 0 }, roles: { customers: 5, technicians: 2, vendors: 1, riders: 1, activeTechnicians: 2, activeVendors: 1, activeRiders: 1, franchiseOwners: 1, cityAdmins: 1 }, kyc: { pending: 2, underReview: 1, verified: 3, rejected: 0, correctionRequired: 1 }, recentActivity: [{ id: 'a-1', eventType: 'user.approved', actorId: 'admin-1', createdAt: '2026-08-16T10:00:00.000Z' }], cities: [{ id: 'city-1', name: 'Bareilly', state: 'UP', district: 'Bareilly', isActive: true, users: 12, technicians: 2, vendors: 1, riders: 1, pending: 3 }], cityOverviewAvailable: true } }), { status: 200 })));
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect((await screen.findAllByText('12')).length).toBeGreaterThan(0);
  expect(screen.getByText('user.approved')).toBeInTheDocument();
  expect(screen.getByText('Bareilly')).toBeInTheDocument();
});
