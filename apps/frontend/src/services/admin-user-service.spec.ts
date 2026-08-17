import { afterEach, vi } from 'vitest';
import { approveAdminUser, rejectAdminUser, requestAdminUserCorrection, suspendAdminUser, reactivateAdminUser, reviewAdminUser } from './admin-user-service';

afterEach(() => vi.restoreAllMocks());

function stubSuccess() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

test('uses the exact approve endpoint', async () => {
  const fetchMock = stubSuccess();
  await approveAdminUser('user-1');
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/admin/users/user-1/approve'), expect.objectContaining({ method: 'PATCH' }));
});

test('uses exact decision endpoints and reason payloads', async () => {
  const fetchMock = stubSuccess();
  await rejectAdminUser('user-1', 'bad document');
  await requestAdminUserCorrection('user-1', 'needs correction');
  await suspendAdminUser('user-1', 'policy');
  await reactivateAdminUser('user-1');
  await reviewAdminUser('user-1');
  expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/reject'), expect.objectContaining({ body: JSON.stringify({ reason: 'bad document' }) }));
  expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining('/request-correction'), expect.objectContaining({ body: JSON.stringify({ reason: 'needs correction' }) }));
  expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringContaining('/suspend'), expect.objectContaining({ body: JSON.stringify({ reason: 'policy' }) }));
  expect(fetchMock).toHaveBeenNthCalledWith(4, expect.stringContaining('/reactivate'), expect.objectContaining({ method: 'PATCH' }));
  expect(fetchMock).toHaveBeenNthCalledWith(5, expect.stringContaining('/review'), expect.objectContaining({ method: 'PATCH' }));
});
