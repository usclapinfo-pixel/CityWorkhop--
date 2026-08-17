import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../store/auth-context';
import { ProtectedRoute, AdminRoute } from './protected-route';
import { UserRole } from '../types/auth';

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

test('redirects unauthenticated users to login', () => {
  sessionStorage.clear();
  render(<AuthProvider><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<ProtectedRoute />}><Route element={<AdminRoute />}><Route path="/admin" element={<span>Admin</span>} /></Route></Route><Route path="/login" element={<span>Login</span>} /></Routes></MemoryRouter></AuthProvider>);
  expect(screen.getByText('Login')).toBeInTheDocument();
});

test('allows an admin role into the admin area', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    success: true,
    data: { user: { id: '1', role: UserRole.SUPER_ADMIN } },
  }), { status: 200 })));
  sessionStorage.setItem('cityworkshop.accessToken', 'test-token');
  sessionStorage.setItem('cityworkshop.user', JSON.stringify({ id: '1', role: UserRole.SUPER_ADMIN }));
  render(<AuthProvider><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<ProtectedRoute />}><Route element={<AdminRoute />}><Route path="/admin" element={<span>Admin</span>} /></Route></Route><Route path="/login" element={<span>Login</span>} /></Routes></MemoryRouter></AuthProvider>);
  await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument());
});
