import { env } from '../config/env';
import type { ApiResponse } from '../types/api';

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const ACCESS_TOKEN_KEY = 'cityworkshop.accessToken';

export const tokenStore = {
  get: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(ACCESS_TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(ACCESS_TOKEN_KEY),
};

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(payload: unknown, status: number): { message: string; details?: unknown } {
  const body = payload && typeof payload === 'object' ? payload as Record<string, any> : {};
  const nestedError = body.error && typeof body.error === 'object' ? body.error as Record<string, any> : undefined;
  const message = nestedError?.message ?? body.message ?? (status === 401
    ? 'Your session has expired.'
    : status === 403
      ? "You don't have permission to perform this action."
      : status === 404
        ? 'The requested resource was not found.'
        : status >= 500
          ? 'Something went wrong on the server.'
          : 'The request could not be completed.');
  return { message, details: nestedError?.details };
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  const token = tokenStore.get();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`, { ...options, headers, signal: controller.signal });
    const payload = await parseResponse(response);
    if (!response.ok) {
      const error = getErrorMessage(payload, response.status);
      throw new ApiClientError(response.status, error.message, error.details);
    }
    if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
      const error = getErrorMessage(payload, response.status);
      throw new ApiClientError(response.status, error.message, error.details);
    }
    return (payload && typeof payload === 'object' && 'data' in payload ? (payload as ApiResponse<T>).data : payload) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiClientError(408, 'The request timed out.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
