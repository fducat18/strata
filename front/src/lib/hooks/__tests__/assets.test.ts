import { vi, describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api', () => ({
  assetApi: {
    updateSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
  },
}));

import { useUpdateAssetSnapshot, useDeleteAssetSnapshot } from '../assets.js';
import { assetApi } from '../../api/index.js';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useUpdateAssetSnapshot', () => {
  it('calls assetApi.updateSnapshot with correct args', async () => {
    const snapshot = { id: 's1', assetId: 'a1', value: '600' };
    vi.mocked(assetApi.updateSnapshot).mockResolvedValue(snapshot as any);
    const { result } = renderHook(() => useUpdateAssetSnapshot(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ assetId: 'a1', snapshotId: 's1', data: { value: '600', observedAt: '2024-06-01T00:00:00Z' } });
    });
    expect(assetApi.updateSnapshot).toHaveBeenCalledWith('a1', 's1', { value: '600', observedAt: '2024-06-01T00:00:00Z' });
  });
});

describe('useDeleteAssetSnapshot', () => {
  it('calls assetApi.deleteSnapshot with correct args', async () => {
    vi.mocked(assetApi.deleteSnapshot).mockResolvedValue(undefined as any);
    const { result } = renderHook(() => useDeleteAssetSnapshot(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ assetId: 'a1', snapshotId: 's1' });
    });
    expect(assetApi.deleteSnapshot).toHaveBeenCalledWith('a1', 's1');
  });
});
