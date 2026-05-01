import { vi, describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  invalidateAssetQueries,
  invalidateCategoryQueries,
  invalidateTagQueries,
} from '../invalidation';

describe('invalidateAssetQueries', () => {
  it('invalidates assets query', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    invalidateAssetQueries(qc);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['assets'] });
  });

  it('invalidates asset + snapshots when id provided', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    invalidateAssetQueries(qc, 'a1');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['assets', 'a1'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['assets', 'a1', 'snapshots'] });
  });
});

describe('invalidateCategoryQueries', () => {
  it('invalidates categories query', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    invalidateCategoryQueries(qc);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['categories'] });
  });
});

describe('invalidateTagQueries', () => {
  it('invalidates tags query', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    invalidateTagQueries(qc);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['tags'] });
  });
});
