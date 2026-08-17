import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, vi } from 'vitest';
import { AuthProvider } from '../store/auth-context';
import { LoginPage } from './login-page';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function mockAuthFetch(role: string) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/login/otp/initiate')) return jsonResponse({ success: true, data: { otpToken: 'otp-token-1', expiresIn: 600000 } });
    if (url.includes('/login/otp/verify')) {
      return jsonResponse({
        success: true,
        data: { user: { id: 'user-1', role }, tokens: { accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 900000, tokenType: 'Bearer' } },
      });
    }
    throw new Error(`Unexpected fetch call: ${url}`);
  });
}

async function completeLogin() {
  await userEvent.type(screen.getByLabelText('Phone number'), '9876543210');
  await userEvent.click(screen.getByRole('button', { name: 'Send access code' }));
  await userEvent.type(await screen.findByLabelText('One-time code'), '123456');
  await userEvent.click(screen.getByRole('button', { name: 'Verify and enter' }));
}

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });

test('a customer signing in is redirected back to the preserved booking location', async () => {
  vi.stubGlobal('fetch', mockAuthFetch('CUSTOMER'));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/booking/continue?applianceId=a-1&serviceId=s-1&cityId=c-1' } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/booking/continue" element={<span>BOOKING_CONTINUE_SCREEN</span>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  await completeLogin();
  expect(await screen.findByText('BOOKING_CONTINUE_SCREEN')).toBeInTheDocument();
});

test('a customer signing in without a saved location returns to the storefront', async () => {
  vi.stubGlobal('fetch', mockAuthFetch('CUSTOMER'));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<span>STOREFRONT_SCREEN</span>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  await completeLogin();
  expect(await screen.findByText('STOREFRONT_SCREEN')).toBeInTheDocument();
});

test('admin sign-in still goes to the admin dashboard by default', async () => {
  vi.stubGlobal('fetch', mockAuthFetch('SUPER_ADMIN'));
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/dashboard" element={<span>ADMIN_DASHBOARD_SCREEN</span>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  await completeLogin();
  expect(await screen.findByText('ADMIN_DASHBOARD_SCREEN')).toBeInTheDocument();
});

test('a role outside the allowed set is still rejected on this login screen', async () => {
  vi.stubGlobal('fetch', mockAuthFetch('TECHNICIAN'));
  render(<AuthProvider><MemoryRouter initialEntries={['/login']}><LoginPage /></MemoryRouter></AuthProvider>);
  await completeLogin();
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('This workspace is restricted to administrators.'));
});
