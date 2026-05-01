/**
 * Axios instance + interceptors. Single source of HTTP config for the app.
 *
 * - 10s timeout on all requests
 * - Response interceptor normalizes errors to ApiError so callers can rely on a stable shape
 */
import axios, { type AxiosError, type AxiosInstance } from 'axios';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  raw: unknown;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function normalizeError(err: AxiosError<{ message?: string; code?: string; requestId?: string }>): ApiError {
  const status = err.response?.status ?? 0;
  const data = err.response?.data;
  return {
    status,
    code: data?.code ?? err.code ?? 'UNKNOWN',
    message: data?.message ?? err.message ?? 'Request failed',
    requestId: data?.requestId ?? (err.response?.headers?.['x-request-id'] as string | undefined),
    raw: err,
  };
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    headers: { 'Content-Type': 'application/json' },
    timeout: DEFAULT_TIMEOUT_MS,
  });
  client.interceptors.response.use(
    (r) => r,
    (err: AxiosError<{ message?: string; code?: string; requestId?: string }>) => Promise.reject(normalizeError(err))
  );
  return client;
}

export const api = createApiClient();
