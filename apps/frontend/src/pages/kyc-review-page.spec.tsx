import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { KycReviewPage } from './kyc-review-page';

function renderPage() {
  return render(<MemoryRouter initialEntries={['/admin/users/user-1/kyc']}><Routes><Route path="/admin/users/:id/kyc" element={<KycReviewPage />} /></Routes></MemoryRouter>);
}

afterEach(() => vi.restoreAllMocks());

test('renders KYC status and private document cards without storage references', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/kyc')) return new Response(JSON.stringify({ success: true, data: [{ id: 'record-1', userId: 'user-1', documentType: 'PAN', submissionStatus: 'SUBMITTED', verificationStatus: 'PENDING', storageReference: 'private://hidden' }] }), { status: 200 });
    return new Response(JSON.stringify({ success: true, data: { id: 'user-1', firstName: 'Asha', lastName: 'Tech', role: 'TECHNICIAN', status: 'KYC_SUBMITTED', defaultCityId: 'city-1', kycVerified: false } }), { status: 200 });
  }));
  renderPage();
  expect(await screen.findByRole('heading', { name: 'Asha Tech' })).toBeInTheDocument();
  expect(screen.getByText('PAN')).toBeInTheDocument();
  expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
  expect(screen.queryByText('private://hidden')).not.toBeInTheDocument();
});

test('shows the backend permission message for a 403 response', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Forbidden' } }), { status: 403 })));
  renderPage();
  expect(await screen.findByText('You are not authorized to access this KYC record.')).toBeInTheDocument();
});

test('requests secure access only after View is clicked', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/kyc')) return new Response(JSON.stringify({ success: true, data: [{ id: 'record-1', userId: 'user-1', documentType: 'SELFIE', submissionStatus: 'COMPLETED', verificationStatus: 'VERIFIED' }] }), { status: 200 });
    if (url.endsWith('/access')) return new Response(JSON.stringify({ success: true, data: { accessUrl: 'https://temporary.example/doc', expiresIn: 300, contentType: 'image/jpeg' } }), { status: 200 });
    return new Response(JSON.stringify({ success: true, data: { id: 'user-1', firstName: 'Asha', lastName: 'Tech', role: 'TECHNICIAN', status: 'ACTIVE', defaultCityId: 'city-1', kycVerified: true } }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  renderPage();
  await screen.findByText('SELFIE');
  expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/access'), expect.anything());
  await screen.getByRole('button', { name: 'View' }).click();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/access'), expect.anything()));
  expect(await screen.findByRole('img', { name: 'SELFIE document' })).toBeInTheDocument();
});
