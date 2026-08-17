import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { CitiesPage } from './cities-page';
import { UserRole } from '../types/auth';
import { AuthProvider } from '../store/auth-context';

function renderPage(role = UserRole.SUPER_ADMIN) {
  sessionStorage.setItem('cityworkshop.user', JSON.stringify({ id: 'admin-1', role }));
  return render(<AuthProvider><MemoryRouter initialEntries={['/admin/cities']}><Routes><Route path="/admin/cities" element={<CitiesPage />} /></Routes></MemoryRouter></AuthProvider>);
}
const city = { id: 'city-1', name: 'Bareilly', state: 'UP', district: 'Bareilly', code: 'BRL', isActive: true, createdAt: '2026-08-16T00:00:00.000Z', updatedAt: '2026-08-16T00:00:00.000Z' };
const page = { data: [city], meta: { page: 1, limit: 25, total: 1, totalPages: 1 } };

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

test('renders city list and server-side filters', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: page }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  renderPage();
  expect(await screen.findByRole('row', { name: /Bareilly/ })).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox', { name: 'Search cities' }), 'Bare');
  await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('search=Bare'), expect.anything()));
});

test('allows create and deactivate actions for Super Admin', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => String(input).endsWith('/deactivate') ? new Response(JSON.stringify({ success: true, data: { ...city, isActive: false } }), { status: 200 }) : new Response(JSON.stringify({ success: true, data: page }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  renderPage();
  await screen.findByRole('row', { name: /Bareilly/ });
  expect(screen.getByRole('button', { name: 'Create city' })).toBeInTheDocument();
  const cityRow = screen.getByRole('row', { name: /Bareilly/ });
  await userEvent.click(within(cityRow).getByRole('button', { name: 'Deactivate' }));
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/deactivate'), expect.objectContaining({ method: 'PATCH' })));
});

test('renders read-only state for scoped Admin', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, data: page }), { status: 200 })));
  renderPage(UserRole.ADMIN);
  expect(await screen.findByText('Read only')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Create city' })).not.toBeInTheDocument();
});

test('renders safe error state for forbidden response', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Forbidden' } }), { status: 403 })));
  renderPage();
  expect(await screen.findByText("You don't have permission to view cities.")).toBeInTheDocument();
});
