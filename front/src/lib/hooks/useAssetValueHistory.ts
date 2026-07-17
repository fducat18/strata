// front/src/lib/hooks/useAssetValueHistory.ts

import { useMemo } from 'react';
import { useAssetSnapshots } from './assets.js';

/**
 * Hook that wraps useAssetSnapshots and filters by time range.
 * 
 * @param assetId - Asset ID to fetch snapshots for
 * @param since - Optional date cutoff; only snapshots with observedAt >= since are returned
 * @returns Filtered asset snapshots with loading/error states
 */
export function useAssetValueHistory(assetId: string, since?: Date) {
  const { data: snapshots, isLoading, isError } = useAssetSnapshots(assetId);

  const sinceTime = since?.getTime();
  const filteredSnapshots = useMemo(() => {
    if (!snapshots) return [];
    if (sinceTime === undefined) return snapshots;
    return snapshots.filter((s) => new Date(s.observedAt).getTime() >= sinceTime);
  }, [snapshots, sinceTime]);

  return {
    data: filteredSnapshots,
    isLoading,
    isError,
  };
}
