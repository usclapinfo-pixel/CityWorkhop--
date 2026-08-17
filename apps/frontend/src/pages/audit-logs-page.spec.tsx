import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { AuditLogsPage } from './audit-logs-page';

function renderPage() {
  return render(<MemoryRouter initialEntries={['/admin/audit-logs']}><Routes><Route path="/admin/audit-logs" element={<AuditLogsPage />} /></Routes></MemoryRouter>);
}

const record = { id: 'audit-1', eventType: 'user.kyc_approved', action: 'update', entityType: 'User', entityId: 'user-1', actorId: 'admin-1', actorRole: 'ADMIN', status: 'success', metadata: { targetUserId: 'user-1', role: 'TECHNICIAN', signedUrl: 'do-not-render' }, createdAt: '2026-08-16T10:00:00.000Z', updatedAt: '2026-08-16T10:00:00.000Z' };

function response(data: unknown, meta = { page: 1, limit: 25, total: 1, totalPages: 1 }) {
  return new Response(JSON.stringify({ success: true, data, meta }), { status: 200 });
}

afterEach(() => vi.restoreAllMocks());

test('renders audit rows and sanitizes sensitive metadata in the detail view', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/audit-1') ? response(record) : response({ records: [record], meta: { page: 1, limit: 25, total: 1, totalPages: 1 } }));
  vi.stubGlobal('fetch', fetchMock);
  renderPage();
  expect(await screen.findByText('user.kyc_approved')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'View' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.queryByText('do-not-render')).not.toBeInTheDocument();
});

test('shows empty state', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response({ records: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0 } })));
  renderPage();
  expect(await screen.findByText('No audit activity')).toBeInTheDocument();
});

test('shows permission denied state', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Forbidden' } }), { status: 403 })));
  renderPage();
  expect(await screen.findByText("You don't have permission to view audit logs.")).toBeInTheDocument();
});

test('applies and resets server-side filters', async () => {
  const fetchMock = vi.fn(async () => response({ records: [record], meta: { page: 1, limit: 25, total: 1, totalPages: 1 } }));
  vi.stubGlobal('fetch', fetchMock);
  renderPage();
  await screen.findByText('user.kyc_approved');
  await userEvent.type(screen.getByRole('textbox', { name: 'Search audit logs' }), 'kyc');
  await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('search=kyc'), expect.anything()));
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/audit-logs\?page=1&limit=25$/), expect.anything()));
});

test('renders pagination controls from backend metadata', async () => {
  const fetchMock = vi.fn(async () => response({ records: [record], meta: { page: 2, limit: 25, total: 50, totalPages: 2 } }));
  vi.stubGlobal('fetch', fetchMock);
  renderPage();
  expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});
