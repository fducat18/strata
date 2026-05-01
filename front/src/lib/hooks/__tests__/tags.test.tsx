import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  tagApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

import { useTags, useTag, useCreateTag, useDeleteTag } from '../tags';
import { tagApi } from '@/lib/api';

const mockTagApi = vi.mocked(tagApi);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useTags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all tags', async () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockTagApi.getAll.mockResolvedValue(tags);
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(tags);
  });
});

describe('useTag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a tag by id', async () => {
    const tag = { id: 't1', name: 'growth' };
    mockTagApi.getById.mockResolvedValue(tag);
    const { result } = renderHook(() => useTag('t1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(tag);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useTag(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateTag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a tag', async () => {
    const tag = { id: 't1', name: 'growth' };
    mockTagApi.create.mockResolvedValue(tag);
    mockTagApi.getAll.mockResolvedValue([tag]);
    const { result } = renderHook(() => useCreateTag(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: 'growth' });
    expect(mockTagApi.create).toHaveBeenCalledWith({ name: 'growth' });
  });
});

describe('useDeleteTag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a tag', async () => {
    mockTagApi.delete.mockResolvedValue(undefined);
    mockTagApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteTag(), { wrapper: createWrapper() });
    await result.current.mutateAsync('t1');
    expect(mockTagApi.delete).toHaveBeenCalledWith('t1');
  });
});
