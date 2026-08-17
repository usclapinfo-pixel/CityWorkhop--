import { afterEach, vi } from 'vitest';
import { getKycDocumentAccess } from './kyc-service';

afterEach(() => vi.restoreAllMocks());

test('uses the protected user and record access endpoint', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: { accessUrl: 'https://temporary.example', expiresIn: 300, contentType: 'application/pdf' } }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const result = await getKycDocumentAccess('user-1', 'record-1');
  expect(result.expiresIn).toBe(300);
  expect(fetchMock).toHaveBeenCalledWith('/api/v1/admin/users/user-1/kyc/record-1/access', expect.objectContaining({ headers: expect.any(Headers) }));
});
