/**
 * React Query invalidation helpers. ALWAYS use these instead of inlining
 * `qc.invalidateQueries({ queryKey: ... })` in mutation onSuccess — keeps
 * cross-resource invalidation in one place.
 */
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function invalidateAssetQueries(qc: QueryClient, id?: string): void {
  qc.invalidateQueries({ queryKey: queryKeys.assetsAll });
  if (id) {
    qc.invalidateQueries({ queryKey: queryKeys.asset(id) });
    qc.invalidateQueries({ queryKey: queryKeys.assetSnapshots(id) });
  }
}

export function invalidateCategoryQueries(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: queryKeys.categories });
}

export function invalidateTagQueries(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: queryKeys.tags });
}

export function invalidateAssetTypeQueries(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: queryKeys.assetTypes });
}
