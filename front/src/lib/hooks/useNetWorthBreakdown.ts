import { useMemo } from 'react';
import { useAssets } from './assets';
import { usePortfolioSnapshots } from './portfolio-snapshots';
import type { Asset, AssetSnapshot } from '../types';

export const FILTER_MODES = ['total', 'by-group', 'by-type', 'by-category'] as const;
export type FilterMode = (typeof FILTER_MODES)[number];

export const GROUP_COLORS: Record<string, string> = {
  FINANCIAL: '#3b82f6',
  REAL_ESTATE: '#22c55e',
  PERSONAL_PROPERTY: '#f97316',
  PHYSICAL_COLLECTIONS: '#a855f7',
  LIABILITIES: '#ef4444',
  OTHER: '#6b7280',
};

const LIABILITY_GROUP = 'LIABILITIES';

function getLatestSnapshotValueAtDate(asset: Asset, dateStr: string): number {
  const cutoff = new Date(dateStr).getTime();
  const candidates = (asset.snapshots ?? []).filter(
    (s: AssetSnapshot) => new Date(s.observedAt).getTime() <= cutoff,
  );
  if (candidates.length === 0) return 0;
  const latest = candidates.reduce((best, s) =>
    new Date(s.observedAt).getTime() > new Date(best.observedAt).getTime() ? s : best,
  );
  return parseFloat(latest.value) || 0;
}

function isLiability(asset: Asset): boolean {
  return asset.assetType?.group === LIABILITY_GROUP;
}

export type BreakdownDataPoint = Record<string, number | string> & { date: string };

export function useNetWorthBreakdown(mode: FilterMode): {
  data: BreakdownDataPoint[];
  keys: string[];
  keyColors: Record<string, string>;
} {
  const { data: assets } = useAssets();
  const { data: portfolioSnapshots } = usePortfolioSnapshots();

  return useMemo(() => {
    if (!assets || !portfolioSnapshots || portfolioSnapshots.length === 0) {
      return { data: [], keys: [], keyColors: {} };
    }

    const activeAssets = assets.filter((a) => !a.disposed);

    const sortedSnapshots = [...portfolioSnapshots].sort(
      (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
    );

    const allKeys = new Set<string>();
    const keyColorsMap: Record<string, string> = {};

    const data: BreakdownDataPoint[] = sortedSnapshots.map((snap) => {
      const dateStr = snap.observedAt;
      const point: BreakdownDataPoint = { date: dateStr };

      if (mode === 'total') {
        let positive = 0;
        let negative = 0;
        for (const asset of activeAssets) {
          const val = getLatestSnapshotValueAtDate(asset, dateStr);
          if (isLiability(asset)) {
            negative += val;
          } else {
            positive += val;
          }
        }
        point['positive'] = positive;
        point['negative'] = negative > 0 ? -negative : 0;
        allKeys.add('positive');
        allKeys.add('negative');
        keyColorsMap['positive'] = '#22c55e';
        keyColorsMap['negative'] = '#ef4444';
      } else if (mode === 'by-group') {
        for (const asset of activeAssets) {
          const group = asset.assetType?.group ?? 'OTHER';
          const val = getLatestSnapshotValueAtDate(asset, dateStr);
          const signedVal = isLiability(asset) ? -val : val;
          point[group] = ((point[group] as number) || 0) + signedVal;
          allKeys.add(group);
          keyColorsMap[group] = GROUP_COLORS[group] ?? '#6b7280';
        }
      } else if (mode === 'by-type') {
        for (const asset of activeAssets) {
          const typeCode = asset.assetType?.code ?? 'UNKNOWN';
          const group = asset.assetType?.group ?? 'OTHER';
          const val = getLatestSnapshotValueAtDate(asset, dateStr);
          const signedVal = isLiability(asset) ? -val : val;
          point[typeCode] = ((point[typeCode] as number) || 0) + signedVal;
          allKeys.add(typeCode);
          keyColorsMap[typeCode] = GROUP_COLORS[group] ?? '#6b7280';
        }
      } else {
        // by-category
        for (const asset of activeAssets) {
          const categoryName =
            asset.categories && asset.categories.length > 0
              ? asset.categories[0].name
              : 'Uncategorized';
          const val = getLatestSnapshotValueAtDate(asset, dateStr);
          const signedVal = isLiability(asset) ? -val : val;
          point[categoryName] = ((point[categoryName] as number) || 0) + signedVal;
          allKeys.add(categoryName);
          // Use group color as category color
          const group = asset.assetType?.group ?? 'OTHER';
          if (!keyColorsMap[categoryName]) {
            keyColorsMap[categoryName] = GROUP_COLORS[group] ?? '#6b7280';
          }
        }
      }

      return point;
    });

    return { data, keys: Array.from(allKeys), keyColors: keyColorsMap };
  }, [assets, portfolioSnapshots, mode]);
}
