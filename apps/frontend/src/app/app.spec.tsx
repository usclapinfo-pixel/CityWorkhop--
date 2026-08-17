import { render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { App } from './app';

afterEach(() => vi.restoreAllMocks());

test('renders the public storefront at the root route', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Browse appliance repair/i })).toBeInTheDocument();
});
