/**
 * Axios instance + interceptors. Single source of HTTP config for the app.
 *
 * - 10s timeout on all requests
 * - Request interceptor attaches a unique X-Request-ID header (UUID) to every outbound request.
 *   This enables end-to-end trace correlation: the same ID flows through browser logs,
 *   NestJS request logs, and error responses. See /docs/request-tracing/ for details.
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
const DESKTOP_BACKEND_URL_KEY = 'STRATA_DESKTOP_BACKEND_URL';
const DESKTOP_TOKEN_KEY = 'STRATA_DESKTOP_TOKEN';
const DESKTOP_TOKEN_HEADER = 'X-Strata-Desktop-Token';

function getDesktopSessionValue(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = window.sessionStorage.getItem(key);
  return value && value.length > 0 ? value : undefined;
}

function getDesktopBackendUrl(): string | undefined {
  return getDesktopSessionValue(DESKTOP_BACKEND_URL_KEY);
}

function getDesktopToken(): string | undefined {
  return getDesktopSessionValue(DESKTOP_TOKEN_KEY);
}

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
    baseURL: getDesktopBackendUrl() || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    headers: { 'Content-Type': 'application/json' },
    timeout: DEFAULT_TIMEOUT_MS,
  });
  // Attach a unique X-Request-ID to every outbound request for end-to-end trace correlation.
  client.interceptors.request.use((config) => {
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = crypto.randomUUID();
    }
    const desktopToken = getDesktopToken();
    if (desktopToken && !config.headers[DESKTOP_TOKEN_HEADER]) {
      config.headers[DESKTOP_TOKEN_HEADER] = desktopToken;
    }
    return config;
  });
  client.interceptors.response.use(
    (r) => r,
    (err: AxiosError<{ message?: string; code?: string; requestId?: string }>) => Promise.reject(normalizeError(err))
  );
  return client;
}

export const api = createApiClient();
