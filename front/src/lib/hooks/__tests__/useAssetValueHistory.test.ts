import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssetValueHistory } from '../useAssetValueHistory.js';
import * as assetsHooks from '../assets.js';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(QueryClientProvider, { client: queryClient }, children)
);

describe('useAssetValueHistory', () => {
  it('returns all snapshots when since is undefined', async () => {
    const mockSnapshots = [
      { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
      { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      { id: 's3', value: '300', observedAt: '2026-07-01T00:00:00Z', assetId: 'a1' },
    ];
    
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      isError: false,
    } as any);
    
    const { result } = renderHook(() => useAssetValueHistory('a1', undefined), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(3);
    });
    
    expect(result.current.data).toEqual(mockSnapshots);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('filters snapshots to only those >= since date', async () => {
    const mockSnapshots = [
      { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
      { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      { id: 's3', value: '300', observedAt: '2026-07-01T00:00:00Z', assetId: 'a1' },
    ];
    
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      isError: false,
    } as any);
    
    const since = new Date('2026-06-01T00:00:00Z');
    const { result } = renderHook(() => useAssetValueHistory('a1', since), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
    
    expect(result.current.data).toEqual([
      { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      { id: 's3', value: '300', observedAt: '2026-07-01T00:00:00Z', assetId: 'a1' },
    ]);
  });

  it('returns empty array when all snapshots are before since date', async () => {
    const mockSnapshots = [
      { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
      { id: 's2', value: '200', observedAt: '2026-02-01T00:00:00Z', assetId: 'a1' },
    ];
    
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      isError: false,
    } as any);
    
    const since = new Date('2026-07-01T00:00:00Z');
    const { result } = renderHook(() => useAssetValueHistory('a1', since), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it('passes through loading and error states', () => {
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);
    
    const { result } = renderHook(() => useAssetValueHistory('a1', undefined), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('returns empty array when snapshots is undefined', () => {
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as any);
    
    const { result } = renderHook(() => useAssetValueHistory('a1', undefined), { wrapper });
    
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
