import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { AuthProvider } from '../store/auth-context';
import { AppRouter } from './app-router';

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

function stubEmptyCatalogFetch() {
  return vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
}

test('renders the public storefront at the root route without authentication', async () => {
  vi.stubGlobal('fetch', stubEmptyCatalogFetch());
  render(<AuthProvider><MemoryRouter initialEntries={['/']}><AppRouter /></MemoryRouter></AuthProvider>);
  expect(await screen.findByRole('heading', { name: /Browse appliance repair/i })).toBeInTheDocument();
});

test('still redirects unauthenticated users away from the protected admin area', async () => {
  vi.stubGlobal('fetch', stubEmptyCatalogFetch());
  render(<AuthProvider><MemoryRouter initialEntries={['/admin/dashboard']}><AppRouter /></MemoryRouter></AuthProvider>);
  expect(await screen.findByText('Sign in to the console')).toBeInTheDocument();
});

test('an unauthenticated visit to booking continuation preserves the full selection in the redirect', async () => {
  vi.stubGlobal('fetch', stubEmptyCatalogFetch());
  render(<AuthProvider><MemoryRouter initialEntries={['/booking/continue?applianceId=a-1&serviceId=s-1&cityId=c-1']}><AppRouter /></MemoryRouter></AuthProvider>);
  expect(await screen.findByText('Sign in to the console')).toBeInTheDocument();
});
