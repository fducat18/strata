import { vi, describe, it, expect } from 'vitest';
import { createApiClient } from '../client';
import type { AxiosError } from 'axios';

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { PUBLIC_API_URL: '' } } });

describe('createApiClient', () => {
  it('returns an axios instance', () => {
    const client = createApiClient();
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
  });

  it('normalizes error in response interceptor', async () => {
    const client = createApiClient();
    // Test the error interceptor by creating a mock error
    const mockErr = {
      response: {
        status: 404,
        data: { message: 'Not found', code: 'NOT_FOUND' },
        headers: {},
      },
      message: 'Request failed with status code 404',
      code: 'ERR_BAD_REQUEST',
    } as unknown as AxiosError;

    // Access the interceptors — we test via the response rejection path
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
