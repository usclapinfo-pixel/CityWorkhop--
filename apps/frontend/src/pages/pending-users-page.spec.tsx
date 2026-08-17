import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { PendingUsersPage } from './pending-users-page';
import { AuthProvider } from '../store/auth-context';

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

const response = (data: unknown, status = 200) => new Response(JSON.stringify(status >= 400 ? { error: { message: 'Forbidden by backend' } } : data), { status });

function renderPage() { return render(<AuthProvider><MemoryRouter><PendingUsersPage /></MemoryRouter></AuthProvider>); }

test('loads pending users and supports role filtering', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response([{ id: 'u-1', firstName: 'Asha', lastName: 'Tech', role: 'TECHNICIAN', status: 'PENDING', defaultCityId: 'city-1', createdAt: '2026-08-16T00:00:00Z' }, { id: 'u-2', firstName: 'Ravi', lastName: 'Vendor', role: 'VENDOR', status: 'KYC_SUBMITTED', defaultCityId: 'city-2' }])));
  renderPage();
  expect(await screen.findByText('Asha Tech')).toBeInTheDocument();
  expect(screen.getByText('Ravi Vendor')).toBeInTheDocument();
});

test('shows empty state for an empty scoped queue', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response([])));
  renderPage();
  expect(await screen.findByText('No users match these filters')).toBeInTheDocument();
});

test('shows backend permission errors safely', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response({}, 403)));
  renderPage();
  await waitFor(() => expect(screen.getByText('Forbidden by backend')).toBeInTheDocument());
});
