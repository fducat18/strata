import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  categoryApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getChildren: vi.fn(),
  },
}));

import {
  useCategories,
  useCategory,
  useCategoryChildren,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../categories';
import { categoryApi } from '@/lib/api';

const mockCategoryApi = vi.mocked(categoryApi);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const cat = { id: 'c1', name: 'Equities', parentId: null };

describe('useCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all categories', async () => {
    mockCategoryApi.getAll.mockResolvedValue([cat]);
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([cat]);
  });
});

describe('useCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a category by id', async () => {
    mockCategoryApi.getById.mockResolvedValue(cat);
    const { result } = renderHook(() => useCategory('c1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(cat);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useCategory(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCategoryChildren', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches children for a category', async () => {
    const children = [{ id: 'c2', name: 'US Stocks', parentId: 'c1' }];
    mockCategoryApi.getChildren.mockResolvedValue(children);
    const { result } = renderHook(() => useCategoryChildren('c1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(children);
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a category', async () => {
    mockCategoryApi.create.mockResolvedValue(cat);
    mockCategoryApi.getAll.mockResolvedValue([cat]);
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: 'Equities' });
    expect(mockCategoryApi.create).toHaveBeenCalledWith({ name: 'Equities' });
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates a category', async () => {
    const updated = { id: 'c1', name: 'Updated', parentId: null };
    mockCategoryApi.update.mockResolvedValue(updated);
    mockCategoryApi.getAll.mockResolvedValue([updated]);
    const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: 'c1', name: 'Updated' });
    expect(mockCategoryApi.update).toHaveBeenCalledWith('c1', 'Updated');
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a category', async () => {
    mockCategoryApi.delete.mockResolvedValue(undefined);
    mockCategoryApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync('c1');
    expect(mockCategoryApi.delete).toHaveBeenCalledWith('c1');
  });
});
