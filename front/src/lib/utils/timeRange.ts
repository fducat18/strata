// front/src/lib/utils/timeRange.ts

export const TIME_RANGES = ['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

/**
 * Convert a TimeRange to a Date cutoff for filtering.
 * Returns undefined for 'ALL' (no filtering).
 */
export function getSinceDate(range: TimeRange): Date | undefined {
  const now = new Date();
  switch (range) {
    case '1D': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }
    case '7D': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case '1M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case '3M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
    case '1Y': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    case 'ALL':
      return undefined;
  }
}
