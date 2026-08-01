import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useResolvedAssetId } from '../useResolvedAssetId.js';

function setSearch(search: string) {
  window.history.replaceState({}, '', `/assets/detail${search}`);
}

describe('useResolvedAssetId', () => {
  afterEach(() => {
    setSearch('');
  });

  it('resolves an explicit id and ignores the URL', async () => {
    setSearch('?id=from-url');
    const { result } = renderHook(() => useResolvedAssetId('explicit-id'));

    await waitFor(() => expect(result.current.isResolving).toBe(false));
    expect(result.current.resolvedAssetId).toBe('explicit-id');
  });

  it('resolves the id from the ?id= query parameter', async () => {
    setSearch('?id=abc-123');
    const { result } = renderHook(() => useResolvedAssetId());

    await waitFor(() => expect(result.current.isResolving).toBe(false));
    expect(result.current.resolvedAssetId).toBe('abc-123');
  });

  it('resolves to null when no id is present', async () => {
    setSearch('');
    const { result } = renderHook(() => useResolvedAssetId());

    await waitFor(() => expect(result.current.isResolving).toBe(false));
    expect(result.current.resolvedAssetId).toBeNull();
  });
});
