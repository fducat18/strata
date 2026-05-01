import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  assetTypeApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

import { useAssetTypes } from '../assetTypes';
import { assetTypeApi } from '@/lib/api';

const mockAssetTypeApi = vi.mocked(assetTypeApi);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useAssetTypes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all asset types', async () => {
    const types = [
      { id: 'at1', code: 'STOCKS', label: 'Stocks' },
      { id: 'at2', code: 'CRYPTO', label: 'Crypto' },
    ];
    mockAssetTypeApi.getAll.mockResolvedValue(types);
    const { result } = renderHook(() => useAssetTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(types);
  });
});
