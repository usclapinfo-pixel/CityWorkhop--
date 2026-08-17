import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { UserDetailsPage } from './user-details-page';

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

test('loads user details and safe KYC status without public document links', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/kyc')) return new Response(JSON.stringify({ success: true, data: [{ id: 'k-1', documentType: 'PAN', submissionStatus: 'SUBMITTED', verificationStatus: 'PENDING', storageReference: 'private://secret' }] }), { status: 200 });
    return new Response(JSON.stringify({ success: true, data: { id: 'u-1', firstName: 'Asha', lastName: 'Tech', role: 'TECHNICIAN', status: 'KYC_SUBMITTED', defaultCityId: 'city-1', kycVerified: false } }), { status: 200 });
  }));
  render(<MemoryRouter initialEntries={['/admin/users/u-1']}><Routes><Route path="/admin/users/:id" element={<UserDetailsPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Asha Tech' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Review KYC' })).toHaveAttribute('href', '/admin/users/u-1/kyc');
  expect(screen.getByText('PAN')).toBeInTheDocument();
  expect(screen.getByText('Secure document availability only. No public link exposed.')).toBeInTheDocument();
  expect(screen.queryByText('private://secret')).not.toBeInTheDocument();
});
