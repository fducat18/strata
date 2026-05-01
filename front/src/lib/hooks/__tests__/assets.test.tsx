import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  assetApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getSnapshots: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    dispose: vi.fn(),
    createSnapshot: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    addCategory: vi.fn(),
    removeCategory: vi.fn(),
  },
}));

import {
  useAssets,
  useAsset,
  useAssetSnapshots,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useDisposeAsset,
  useCreateAssetSnapshot,
  useAddTagToAsset,
  useRemoveTagFromAsset,
  useAddCategoryToAsset,
  useRemoveCategoryFromAsset,
} from '../assets';
import { assetApi } from '@/lib/api';

const mockAssetApi = vi.mocked(assetApi);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const mockAsset = { id: 'a1', name: 'My Stock', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '' };

describe('useAssets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all assets', async () => {
    mockAssetApi.getAll.mockResolvedValue([mockAsset]);
    const { result } = renderHook(() => useAssets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockAsset]);
  });

  it('fetches assets for a portfolio', async () => {
    mockAssetApi.getAll.mockResolvedValue([mockAsset]);
    const { result } = renderHook(() => useAssets('p1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAssetApi.getAll).toHaveBeenCalledWith('p1');
  });
});

describe('useAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a single asset', async () => {
    mockAssetApi.getById.mockResolvedValue(mockAsset);
    const { result } = renderHook(() => useAsset('a1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockAsset);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useAsset(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useAssetSnapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches asset snapshots', async () => {
    const snapshots = [{ id: 's1', assetId: 'a1', value: '500' }];
    mockAssetApi.getSnapshots.mockResolvedValue(snapshots);
    const { result } = renderHook(() => useAssetSnapshots('a1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(snapshots);
  });
});

describe('useCreateAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates an asset', async () => {
    mockAssetApi.create.mockResolvedValue(mockAsset);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useCreateAsset(), { wrapper: createWrapper() });
    const req = { name: 'My Stock', assetTypeId: 'at1' };
    await result.current.mutateAsync(req);
    expect(mockAssetApi.create).toHaveBeenCalledWith(req);
  });
});

describe('useUpdateAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates an asset', async () => {
    mockAssetApi.update.mockResolvedValue(mockAsset);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useUpdateAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: 'a1', data: { name: 'Updated' } });
    expect(mockAssetApi.update).toHaveBeenCalledWith('a1', { name: 'Updated' });
  });
});

describe('useDeleteAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes an asset', async () => {
    mockAssetApi.delete.mockResolvedValue(undefined);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync('a1');
    expect(mockAssetApi.delete).toHaveBeenCalledWith('a1');
  });
});

describe('useDisposeAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('disposes an asset', async () => {
    mockAssetApi.dispose.mockResolvedValue({ ...mockAsset, disposed: true });
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useDisposeAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync('a1');
    expect(mockAssetApi.dispose).toHaveBeenCalledWith('a1');
  });
});

describe('useCreateAssetSnapshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a snapshot', async () => {
    const snapshot = { id: 's1', assetId: 'a1', value: '500' };
    mockAssetApi.createSnapshot.mockResolvedValue(snapshot);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useCreateAssetSnapshot(), { wrapper: createWrapper() });
    const req = { value: '500', observedAt: '2024-01-01T00:00:00Z' };
    await result.current.mutateAsync({ id: 'a1', data: req });
    expect(mockAssetApi.createSnapshot).toHaveBeenCalledWith('a1', req);
  });
});

describe('useAddTagToAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a tag to an asset', async () => {
    mockAssetApi.addTag.mockResolvedValue(undefined);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useAddTagToAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ assetId: 'a1', tagId: 't1' });
    expect(mockAssetApi.addTag).toHaveBeenCalledWith('a1', 't1');
  });
});

describe('useRemoveTagFromAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes a tag from an asset', async () => {
    mockAssetApi.removeTag.mockResolvedValue(undefined);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useRemoveTagFromAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ assetId: 'a1', tagId: 't1' });
    expect(mockAssetApi.removeTag).toHaveBeenCalledWith('a1', 't1');
  });
});

describe('useAddCategoryToAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a category to an asset', async () => {
    mockAssetApi.addCategory.mockResolvedValue(undefined);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useAddCategoryToAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ assetId: 'a1', categoryId: 'c1' });
    expect(mockAssetApi.addCategory).toHaveBeenCalledWith('a1', 'c1');
  });
});

describe('useRemoveCategoryFromAsset', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes a category from an asset', async () => {
    mockAssetApi.removeCategory.mockResolvedValue(undefined);
    mockAssetApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useRemoveCategoryFromAsset(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ assetId: 'a1', categoryId: 'c1' });
    expect(mockAssetApi.removeCategory).toHaveBeenCalledWith('a1', 'c1');
  });
});
