import { vi, describe, it, expect, afterEach } from 'vitest';
import { createApiClient } from '../client';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { PUBLIC_API_URL: '' } } });

describe('createApiClient', () => {
  it('returns an axios instance', () => {
    const client = createApiClient();
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
  });

  it('attaches X-Request-ID header via request interceptor', async () => {
    const client = createApiClient();
    const requestInterceptors = (client.interceptors.request as any).handlers;
    expect(requestInterceptors.length).toBeGreaterThan(0);
    const handler = requestInterceptors[0];

    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = await handler.fulfilled(config);
    expect(result.headers['X-Request-ID']).toBeDefined();
    expect(typeof result.headers['X-Request-ID']).toBe('string');
    // UUID format
    expect(result.headers['X-Request-ID']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('does not overwrite an existing X-Request-ID header', async () => {
    const client = createApiClient();
    const requestInterceptors = (client.interceptors.request as any).handlers;
    const handler = requestInterceptors[0];

    const existingId = 'my-custom-request-id';
    const config = { headers: { 'X-Request-ID': existingId } } as InternalAxiosRequestConfig;
    const result = await handler.fulfilled(config);
    expect(result.headers['X-Request-ID']).toBe(existingId);
  });

  it('normalizes error in response interceptor', async () => {
    const client = createApiClient();
    const mockErr = {
      response: {
        status: 404,
        data: { message: 'Not found', code: 'NOT_FOUND' },
        headers: {},
      },
      message: 'Request failed with status code 404',
      code: 'ERR_BAD_REQUEST',
    } as unknown as AxiosError;

    const interceptors = (client.interceptors.response as any).handlers;
    expect(interceptors.length).toBeGreaterThan(0);
    const handler = interceptors[0];
    
    await expect(handler.rejected(mockErr)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Not found',
    });
  });

  it('normalizes error without response', async () => {
    const client = createApiClient();
    const mockErr = {
      response: undefined,
      message: 'Network Error',
      code: 'ECONNREFUSED',
    } as unknown as AxiosError;

    const interceptors = (client.interceptors.response as any).handlers;
    const handler = interceptors[0];
    
    await expect(handler.rejected(mockErr)).rejects.toMatchObject({
      status: 0,
      code: 'ECONNREFUSED',
      message: 'Network Error',
    });
  });
});

describe('createApiClient — desktop storage', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('uses the desktop backend URL from localStorage', () => {
    window.localStorage.setItem('STRATA_DESKTOP_BACKEND_URL', 'http://127.0.0.1:3456/api/v1');
    expect(createApiClient().defaults.baseURL).toBe('http://127.0.0.1:3456/api/v1');
  });

  it('prefers localStorage over sessionStorage for the backend URL', () => {
    window.localStorage.setItem('STRATA_DESKTOP_BACKEND_URL', 'http://local:3456/api/v1');
    window.sessionStorage.setItem('STRATA_DESKTOP_BACKEND_URL', 'http://session:3456/api/v1');
    expect(createApiClient().defaults.baseURL).toBe('http://local:3456/api/v1');
  });

  it('falls back to sessionStorage for the backend URL (legacy desktop sessions)', () => {
    window.sessionStorage.setItem('STRATA_DESKTOP_BACKEND_URL', 'http://session:3456/api/v1');
    expect(createApiClient().defaults.baseURL).toBe('http://session:3456/api/v1');
  });

  it('attaches the desktop token header from localStorage', async () => {
    window.localStorage.setItem('STRATA_DESKTOP_TOKEN', 'desktop-secret');
    const handler = (createApiClient().interceptors.request as any).handlers[0];
    const result = await handler.fulfilled({ headers: {} });
    expect(result.headers['X-Strata-Desktop-Token']).toBe('desktop-secret');
  });
});
