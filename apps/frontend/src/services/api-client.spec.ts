import { afterEach, vi } from 'vitest';
import { ApiClientError, request } from './api-client';

afterEach(() => vi.restoreAllMocks());

test('maps forbidden responses to a safe permission error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Forbidden by backend' } }), { status: 403 })));
  await expect(request('/admin/users')).rejects.toEqual(expect.objectContaining({ status: 403, message: 'Forbidden by backend' }));
});
