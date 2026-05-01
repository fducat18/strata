/**
 * Stable React Query keys. One source of truth so invalidation never drifts.
 */
export const queryKeys = {
  portfolioSnapshots: {
    all: () => ['portfolio-snapshots'] as const,
    currentValue: () => ['portfolio-snapshots', 'current-value'] as const,
  },

  assets: () => ['assets'] as const,
  assetsAll: ['assets'] as const,
  asset: (id: string) => ['assets', id] as const,
  assetSnapshots: (id: string) => ['assets', id, 'snapshots'] as const,

  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  categoryChildren: (id: string) => ['categories', id, 'children'] as const,

  tags: ['tags'] as const,
  tag: (id: string) => ['tags', id] as const,

  assetTypes: ['asset-types'] as const,
};
