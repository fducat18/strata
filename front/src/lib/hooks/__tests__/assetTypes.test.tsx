import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  assetTypeApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from '../assetTypes';
import { assetTypeApi } from '@/lib/api';

const mockAssetTypeApi = vi.mocked(assetTypeApi);

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useAssetTypes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all asset types', async () => {
    const types = [
      { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
      { id: 'at2', code: 'CRYPTO', label: 'Crypto', group: 'FINANCIAL' },
    ];
    mockAssetTypeApi.getAll.mockResolvedValue(types);
    const { result } = renderHook(() => useAssetTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(types);
  });
});

describe('useCreateAssetType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls assetTypeApi.create with data', async () => {
    const newType = { id: 'at3', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' };
    mockAssetTypeApi.create.mockResolvedValue(newType);
    mockAssetTypeApi.getAll.mockResolvedValue([newType]);
    const { result } = renderHook(() => useCreateAssetType(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
    expect(mockAssetTypeApi.create).toHaveBeenCalledWith({
      code: 'CRYPTO_ETF',
      label: 'Crypto ETF',
      group: 'FINANCIAL',
    });
  });
});

describe('useUpdateAssetType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls assetTypeApi.update with id and data', async () => {
    const updated = { id: 'at1', code: 'STOCKS', label: 'Public Stocks', group: 'FINANCIAL' };
    mockAssetTypeApi.update.mockResolvedValue(updated);
    mockAssetTypeApi.getAll.mockResolvedValue([updated]);
    const { result } = renderHook(() => useUpdateAssetType(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: 'at1', label: 'Public Stocks', group: 'FINANCIAL' });
    expect(mockAssetTypeApi.update).toHaveBeenCalledWith('at1', {
      label: 'Public Stocks',
      group: 'FINANCIAL',
    });
  });
});

describe('useDeleteAssetType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls assetTypeApi.delete with id', async () => {
    mockAssetTypeApi.delete.mockResolvedValue(undefined);
    mockAssetTypeApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteAssetType(), { wrapper: createWrapper() });
    await result.current.mutateAsync('at1');
    expect(mockAssetTypeApi.delete).toHaveBeenCalledWith('at1');
  });
});
