import { request, tokenStore } from './api-client';
import type { AuthResponse, AuthUser, OtpResponse } from '../types/auth';

export async function initiateLoginOtp(phoneNumber: string, channel: 'sms' | 'whatsapp' = 'whatsapp') {
  return request<OtpResponse['data']>('/api/v1/auth/login/otp/initiate', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, channel, language: 'EN' }),
  });
}

export async function verifyLoginOtp(otpToken: string, otp: string): Promise<AuthResponse['data']> {
  const response = await request<AuthResponse['data']>('/api/v1/auth/login/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ otpToken, otp }),
  });
  tokenStore.set(response.tokens.accessToken);
  sessionStorage.setItem('cityworkshop.user', JSON.stringify(response.user));
  sessionStorage.setItem('cityworkshop.refreshToken', response.tokens.refreshToken);
  return response;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await request<{ user: AuthUser }>('/api/v1/auth/me');
  return response.user;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    tokenStore.clear();
    sessionStorage.removeItem('cityworkshop.user');
    sessionStorage.removeItem('cityworkshop.refreshToken');
  }
}
