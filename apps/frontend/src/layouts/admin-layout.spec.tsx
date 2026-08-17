import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../store/auth-context';
import { AdminLayout } from './admin-layout';
import { UserRole } from '../types/auth';

test('renders admin layout navigation', () => {
  sessionStorage.setItem('cityworkshop.accessToken', 'test-token');
  sessionStorage.setItem('cityworkshop.user', JSON.stringify({ id: '1', firstName: 'Sam', lastName: 'Admin', role: UserRole.ADMIN }));
  render(<AuthProvider><MemoryRouter><AdminLayout /></MemoryRouter></AuthProvider>);
  expect(screen.getByText('City Workshop')).toBeInTheDocument();
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Providers')).toBeInTheDocument();
});
