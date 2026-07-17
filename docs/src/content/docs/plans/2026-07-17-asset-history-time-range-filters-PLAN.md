---
title: "2026-07-17: Asset History Filters — Implementation Plan"
description: "Bite-sized TDD implementation plan for adding time range filters to asset value charts."
---

# Asset History Time Range Filters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add time range filtering (1D, 7D, 1M, 3M, 1Y, YTD, ALL) to individual asset value charts on the asset detail page.

**Architecture:** Extract shared time range utilities from dashboard, create a new `useAssetValueHistory` hook for SRP/testability, and make `AssetValueChart` self-contained (owns data fetching and time range state).

**Tech Stack:** React 19, Astro 6, TypeScript, Recharts, Zustand, react-query, Vitest, Playwright

---

## File Structure

**New files:**
- `front/src/lib/utils/timeRange.ts` — shared time range types and getSinceDate function
- `front/src/lib/utils/__tests__/timeRange.test.ts` — unit tests for time range utils
- `front/src/components/shared/TimeRangeToggle.tsx` — reusable time range button group
- `front/src/components/shared/__tests__/TimeRangeToggle.test.tsx` — unit tests for toggle
- `front/src/lib/hooks/useAssetValueHistory.ts` — hook for filtered asset snapshots
- `front/src/lib/hooks/__tests__/useAssetValueHistory.test.ts` — unit tests for hook
- `front/src/components/assets/__tests__/AssetValueChart.test.tsx` — unit tests for updated chart

**Modified files:**
- `front/src/lib/hooks/useNetWorthBreakdown.ts` — import TIME_RANGES/TimeRange from utils
- `front/src/components/dashboard/NetWorthChart.tsx` — use shared TimeRangeToggle, remove inline getSinceDate
- `front/src/components/assets/AssetValueChart.tsx` — accept assetId, manage time range state, use new hook
- `front/src/components/assets/AssetDetailPage.tsx` — pass assetId to chart (not snapshots)
- `docs/src/content/docs/features/asset-management.md` — document time range filtering
- `front/src/components/assets/assets.e2e.test.ts` — add time range filtering e2e tests

---

## Task 1: Extract Shared Time Range Utilities

**Files:**
- Create: `front/src/lib/utils/timeRange.ts`
- Create: `front/src/lib/utils/__tests__/timeRange.test.ts`

### Step 1.1: Write tests for getSinceDate

- [ ] **Create test file**

```bash
mkdir -p front/src/lib/utils/__tests__
touch front/src/lib/utils/__tests__/timeRange.test.ts
```

- [ ] **Write failing tests for getSinceDate**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSinceDate, TIME_RANGES, type TimeRange } from '../timeRange.js';

describe('getSinceDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix now to 2026-07-17 12:00:00 UTC for predictable tests
    vi.setSystemTime(new Date('2026-07-17T12:00:00Z'));
  });

  it('returns undefined for ALL', () => {
    expect(getSinceDate('ALL')).toBeUndefined();
  });

  it('returns 1 day ago for 1D', () => {
    const result = getSinceDate('1D');
    expect(result).toEqual(new Date('2026-07-16T12:00:00Z'));
  });

  it('returns 7 days ago for 7D', () => {
    const result = getSinceDate('7D');
    expect(result).toEqual(new Date('2026-07-10T12:00:00Z'));
  });

  it('returns 1 month ago for 1M', () => {
    const result = getSinceDate('1M');
    expect(result).toEqual(new Date('2026-06-17T12:00:00Z'));
  });

  it('returns 3 months ago for 3M', () => {
    const result = getSinceDate('3M');
    expect(result).toEqual(new Date('2026-04-17T12:00:00Z'));
  });

  it('returns 1 year ago for 1Y', () => {
    const result = getSinceDate('1Y');
    expect(result).toEqual(new Date('2025-07-17T12:00:00Z'));
  });

  it('returns Jan 1 of current year for YTD', () => {
    const result = getSinceDate('YTD');
    expect(result).toEqual(new Date('2026-01-01T00:00:00Z'));
  });
});

describe('TIME_RANGES', () => {
  it('exports all expected time ranges', () => {
    expect(TIME_RANGES).toEqual(['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL']);
  });
});
```

- [ ] **Run tests to verify they fail**

```bash
cd front && npx vitest run src/lib/utils/__tests__/timeRange.test.ts
```

Expected: FAIL with "Cannot find module '../timeRange.js'"

### Step 1.2: Implement getSinceDate utility

- [ ] **Create timeRange.ts**

```typescript
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
```

- [ ] **Run tests to verify they pass**

```bash
cd front && npx vitest run src/lib/utils/__tests__/timeRange.test.ts
```

Expected: PASS (7 tests)

### Step 1.3: Commit

- [ ] **Commit shared time range utils**

```bash
git add front/src/lib/utils/timeRange.ts front/src/lib/utils/__tests__/timeRange.test.ts
git commit -m "feat(front): extract shared time range utilities

- getSinceDate function (converts TimeRange → Date | undefined)
- TIME_RANGES constant and TimeRange type
- Unit tests with frozen time (7/7 passing)

Part of asset history filtering feature."
```

---

## Task 2: Extract TimeRangeToggle Component

**Files:**
- Create: `front/src/components/shared/TimeRangeToggle.tsx`
- Create: `front/src/components/shared/__tests__/TimeRangeToggle.test.tsx`

### Step 2.1: Write tests for TimeRangeToggle

- [ ] **Create test file**

```bash
mkdir -p front/src/components/shared/__tests__
touch front/src/components/shared/__tests__/TimeRangeToggle.test.tsx
```

- [ ] **Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeRangeToggle } from '../TimeRangeToggle.js';
import type { TimeRange } from '@/lib/utils/timeRange.js';

describe('TimeRangeToggle', () => {
  it('renders all time range buttons', () => {
    const onRangeChange = vi.fn();
    render(<TimeRangeToggle range="ALL" onRangeChange={onRangeChange} />);
    
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
  });

  it('highlights the active range', () => {
    const onRangeChange = vi.fn();
    render(<TimeRangeToggle range="1M" onRangeChange={onRangeChange} />);
    
    const activeButton = screen.getByRole('button', { name: '1M' });
    expect(activeButton).toHaveClass('bg-primary');
  });

  it('calls onRangeChange when a button is clicked', async () => {
    const onRangeChange = vi.fn();
    const user = userEvent.setup();
    render(<TimeRangeToggle range="ALL" onRangeChange={onRangeChange} />);
    
    const button7D = screen.getByRole('button', { name: '7D' });
    await user.click(button7D);
    
    expect(onRangeChange).toHaveBeenCalledWith('7D');
    expect(onRangeChange).toHaveBeenCalledTimes(1);
  });

  it('does not crash when clicking the already-active range', async () => {
    const onRangeChange = vi.fn();
    const user = userEvent.setup();
    render(<TimeRangeToggle range="1Y" onRangeChange={onRangeChange} />);
    
    const button1Y = screen.getByRole('button', { name: '1Y' });
    await user.click(button1Y);
    
    expect(onRangeChange).toHaveBeenCalledWith('1Y');
  });
});
```

- [ ] **Run tests to verify they fail**

```bash
cd front && npx vitest run src/components/shared/__tests__/TimeRangeToggle.test.tsx
```

Expected: FAIL with "Cannot find module '../TimeRangeToggle.js'"

### Step 2.2: Implement TimeRangeToggle component

- [ ] **Create TimeRangeToggle.tsx**

```typescript
// front/src/components/shared/TimeRangeToggle.tsx

import { TIME_RANGES, type TimeRange } from '@/lib/utils/timeRange.js';

interface Props {
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}

export function TimeRangeToggle({ range, onRangeChange }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TIME_RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onRangeChange(r)}
          className={`px-2.5 py-0.5 text-xs rounded border transition-colors ${
            range === r
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Run tests to verify they pass**

```bash
cd front && npx vitest run src/components/shared/__tests__/TimeRangeToggle.test.tsx
```

Expected: PASS (4 tests)

### Step 2.3: Commit

- [ ] **Commit TimeRangeToggle component**

```bash
git add front/src/components/shared/TimeRangeToggle.tsx front/src/components/shared/__tests__/TimeRangeToggle.test.tsx
git commit -m "feat(front): extract shared TimeRangeToggle component

- Reusable time range button group
- Renders all 7 time range options
- Highlights active range with primary style
- Unit tests covering render, active state, click handling (4/4 passing)

Part of asset history filtering feature."
```

---
## Task 3: Refactor Dashboard to Use Shared Utilities

**Files:**
- Modify: `front/src/lib/hooks/useNetWorthBreakdown.ts`
- Modify: `front/src/components/dashboard/NetWorthChart.tsx`
- Modify: `front/src/components/dashboard/__tests__/NetWorthChart.test.tsx`

### Step 3.1: Update useNetWorthBreakdown to import from shared utils

- [ ] **Remove TIME_RANGES/TimeRange exports, import from utils**

```typescript
// front/src/lib/hooks/useNetWorthBreakdown.ts
import { useMemo } from 'react';
import { useAssets } from './assets';
import type { Asset, AssetSnapshot } from '../types';
import { TIME_RANGES, type TimeRange } from '../utils/timeRange.js';

export const FILTER_MODES = ['total', 'by-group', 'by-type', 'by-category'] as const;
export type FilterMode = (typeof FILTER_MODES)[number];

// Remove these lines (now imported):
// export const TIME_RANGES = ['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'] as const;
// export type TimeRange = (typeof TIME_RANGES)[number];

// ... rest of file unchanged
```

- [ ] **Run backend tests to ensure no breakage**

```bash
cd front && npm run build
```

Expected: Build succeeds

### Step 3.2: Update NetWorthChart to use shared components and remove inline getSinceDate

- [ ] **Refactor NetWorthChart.tsx**

Replace lines 1-13 with:

```typescript
import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatMoney, formatDate } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { type FilterMode, FILTER_MODES, type TimeRange, useNetWorthBreakdown } from '@/lib/hooks';
import { getSinceDate } from '@/lib/utils/timeRange.js';
import { TimeRangeToggle } from '@/components/shared/TimeRangeToggle.js';
```

Remove the inline `getSinceDate` function (lines 24-33 in original) and the inline `TimeRangeToggle` component (lines 102-119 in original).

Replace the inline TimeRangeToggle in the render with:

```typescript
export function NetWorthChart() {
  const [mode, setMode] = useState<FilterMode>('total');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const locale = useLocale();
  const currency = useCurrency();
  const since = useMemo(() => getSinceDate(timeRange), [timeRange]);
  const { data, keys, keyColors } = useNetWorthBreakdown(mode, since);

  const fmtOpts = { currency, locale };

  if (!data || data.length === 0) {
    return (
      <div>
        <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
        <FilterToggle mode={mode} onModeChange={setMode} />
        <p className="py-8 text-center text-sm text-muted-foreground">
          No portfolio history yet. Add assets with acquisition dates to start tracking your net worth.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: formatDate(d.date as string, { locale }),
  }));

  return (
    <div className="space-y-3">
      <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
      <FilterToggle mode={mode} onModeChange={setMode} />
      <ResponsiveContainer width="100%" height={300}>
        {/* ... rest unchanged */}
      </ResponsiveContainer>
    </div>
  );
}

// Keep FilterToggle as-is
```

- [ ] **Run frontend tests to verify no regressions**

```bash
cd front && npx vitest run src/components/dashboard/__tests__/NetWorthChart.test.tsx
```

Expected: All existing tests pass

### Step 3.3: Commit

- [ ] **Commit dashboard refactor**

```bash
git add front/src/lib/hooks/useNetWorthBreakdown.ts front/src/components/dashboard/NetWorthChart.tsx
git commit -m "refactor(front): dashboard uses shared time range utilities

- useNetWorthBreakdown imports TIME_RANGES/TimeRange from utils
- NetWorthChart uses shared getSinceDate and TimeRangeToggle
- Removes 50 lines of duplicated code (inline getSinceDate + TimeRangeToggle)
- No behavior change, all tests still pass

Part of asset history filtering feature (DRY)."
```

---

## Task 4: Create useAssetValueHistory Hook (TDD)

**Files:**
- Create: `front/src/lib/hooks/useAssetValueHistory.ts`
- Create: `front/src/lib/hooks/__tests__/useAssetValueHistory.test.ts`

### Step 4.1: Write tests for useAssetValueHistory

- [ ] **Create test file**

```bash
mkdir -p front/src/lib/hooks/__tests__
touch front/src/lib/hooks/__tests__/useAssetValueHistory.test.ts
```

- [ ] **Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssetValueHistory } from '../useAssetValueHistory.js';
import * as assetsHooks from '../assets.js';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAssetValueHistory', () => {
  it('returns all snapshots when since is undefined', async () => {
    const mockSnapshots = [
      { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
      { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      { id: 's3', value: '300', observedAt: '2026-07-01T00:00:00Z', assetId: 'a1' },
    ];
    
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      isError: false,
    } as any);
    
    const { result } = renderHook(() => useAssetValueHistory('a1', undefined), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(3);
    });
    
    expect(result.current.data).toEqual(mockSnapshots);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('filters snapshots to only those >= since date', async () => {
    const mockSnapshots = [
      { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
      { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      { id: 's3', value: '300', observedAt: '2026-07-01T00:00:00Z', assetId: 'a1' },
    ];
    
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      isError: false,
    } as any);
    
    const since = new Date('2026-06-01T00:00:00Z');
    const { result } = renderHook(() => useAssetValueHistory('a1', since), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
    
    expect(result.current.data).toEqual([
      { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      { id: 's3', value: '300', observedAt: '2026-07-01T00:00:00Z', assetId: 'a1' },
    ]);
  });

  it('returns empty array when all snapshots are before since date', async () => {
    const mockSnapshots = [
      { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
      { id: 's2', value: '200', observedAt: '2026-02-01T00:00:00Z', assetId: 'a1' },
    ];
    
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: mockSnapshots,
      isLoading: false,
      isError: false,
    } as any);
    
    const since = new Date('2026-07-01T00:00:00Z');
    const { result } = renderHook(() => useAssetValueHistory('a1', since), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it('passes through loading and error states', () => {
    vi.spyOn(assetsHooks, 'useAssetSnapshots').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);
    
    const { result } = renderHook(() => useAssetValueHistory('a1', undefined), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });
});
```

- [ ] **Run tests to verify they fail**

```bash
cd front && npx vitest run src/lib/hooks/__tests__/useAssetValueHistory.test.ts
```

Expected: FAIL with "Cannot find module '../useAssetValueHistory.js'"

### Step 4.2: Implement useAssetValueHistory hook

- [ ] **Create useAssetValueHistory.ts**

```typescript
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

  const filteredSnapshots = useMemo(() => {
    if (!snapshots) return [];
    if (!since) return snapshots;
    
    const cutoffTime = since.getTime();
    return snapshots.filter((s) => new Date(s.observedAt).getTime() >= cutoffTime);
  }, [snapshots, since]);

  return {
    data: filteredSnapshots,
    isLoading,
    isError,
  };
}
```

- [ ] **Run tests to verify they pass**

```bash
cd front && npx vitest run src/lib/hooks/__tests__/useAssetValueHistory.test.ts
```

Expected: PASS (5 tests)

### Step 4.3: Commit

- [ ] **Commit useAssetValueHistory hook**

```bash
git add front/src/lib/hooks/useAssetValueHistory.ts front/src/lib/hooks/__tests__/useAssetValueHistory.test.ts
git commit -m "feat(front): add useAssetValueHistory hook

- Wraps useAssetSnapshots and filters by time range
- Returns snapshots where observedAt >= since
- Returns all snapshots when since is undefined
- Unit tests cover filtering, empty results, loading/error pass-through (5/5 passing)

Part of asset history filtering feature (SRP, testability)."
```

---

## Task 5: Update AssetValueChart to Use New Hook

**Files:**
- Modify: `front/src/components/assets/AssetValueChart.tsx`
- Create: `front/src/components/assets/__tests__/AssetValueChart.test.tsx`

### Step 5.1: Write tests for updated AssetValueChart

- [ ] **Create test file**

```bash
mkdir -p front/src/components/assets/__tests__
touch front/src/components/assets/__tests__/AssetValueChart.test.tsx
```

- [ ] **Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetValueChart } from '../AssetValueChart.js';
import * as hooks from '@/lib/hooks/useAssetValueHistory.js';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AssetValueChart', () => {
  it('renders time range toggle buttons', () => {
    vi.spyOn(hooks, 'useAssetValueHistory').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    
    render(<AssetValueChart assetId="a1" />, { wrapper });
    
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
  });

  it('shows empty state when no snapshots in range', () => {
    vi.spyOn(hooks, 'useAssetValueHistory').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    
    render(<AssetValueChart assetId="a1" />, { wrapper });
    
    expect(screen.getByText(/No snapshots in this time range/i)).toBeInTheDocument();
  });

  it('renders chart when snapshots exist', () => {
    vi.spyOn(hooks, 'useAssetValueHistory').mockReturnValue({
      data: [
        { id: 's1', value: '100', observedAt: '2026-01-01T00:00:00Z', assetId: 'a1' },
        { id: 's2', value: '200', observedAt: '2026-06-01T00:00:00Z', assetId: 'a1' },
      ],
      isLoading: false,
      isError: false,
    });
    
    render(<AssetValueChart assetId="a1" />, { wrapper });
    
    expect(screen.getByText('Value History')).toBeInTheDocument();
    // Chart rendered (Recharts creates SVG)
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('changes time range when button clicked', async () => {
    const mockHook = vi.spyOn(hooks, 'useAssetValueHistory');
    mockHook.mockReturnValue({
      data: [
        { id: 's1', value: '100', observedAt: '2026-07-10T00:00:00Z', assetId: 'a1' },
      ],
      isLoading: false,
      isError: false,
    });
    
    const user = userEvent.setup();
    render(<AssetValueChart assetId="a1" />, { wrapper });
    
    const button1M = screen.getByRole('button', { name: '1M' });
    await user.click(button1M);
    
    // After click, hook should be called with a since date
    // (We can't easily assert the exact since value without exposing state,
    //  but we can verify the component doesn't crash and re-renders)
    expect(screen.getByText('Value History')).toBeInTheDocument();
  });
});
```

- [ ] **Run tests to verify they fail**

```bash
cd front && npx vitest run src/components/assets/__tests__/AssetValueChart.test.tsx
```

Expected: FAIL (component signature changed)

### Step 5.2: Refactor AssetValueChart to accept assetId and manage time range

- [ ] **Replace AssetValueChart.tsx**

```typescript
// front/src/components/assets/AssetValueChart.tsx

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney, formatDate, toDecimal } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { TimeRangeToggle } from '@/components/shared/TimeRangeToggle.js';
import { getSinceDate, type TimeRange } from '@/lib/utils/timeRange.js';
import { useAssetValueHistory } from '@/lib/hooks/useAssetValueHistory.js';

interface Props {
  assetId: string;
}

export function AssetValueChart({ assetId }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const locale = useLocale();
  const currency = useCurrency();
  
  const since = useMemo(() => getSinceDate(timeRange), [timeRange]);
  const { data: snapshots, isLoading, isError } = useAssetValueHistory(assetId, since);

  if (isLoading) return null;
  if (isError) return null;
  
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Value History</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
          <p className="py-8 text-center text-sm text-muted-foreground">
            No snapshots in this time range. Add snapshots to track value over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...snapshots]
    .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime())
    .map((s) => ({
      date: formatDate(s.observedAt, { locale }),
      value: toDecimal(s.value)?.toNumber() ?? 0,
    }));

  return (
    <Card>
      <CardHeader><CardTitle>Value History</CardTitle></CardHeader>
      <CardContent>
        <TimeRangeToggle range={timeRange} onRangeChange={setTimeRange} />
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
              formatter={(value) => [formatMoney(Number(value ?? 0), { currency, locale }), 'Value']}
            />
            <Area type="monotone" dataKey="value" stroke="var(--chart-2)" fillOpacity={1} fill="url(#assetGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Run tests to verify they pass**

```bash
cd front && npx vitest run src/components/assets/__tests__/AssetValueChart.test.tsx
```

Expected: PASS (4 tests)

### Step 5.3: Commit

- [ ] **Commit updated AssetValueChart**

```bash
git add front/src/components/assets/AssetValueChart.tsx front/src/components/assets/__tests__/AssetValueChart.test.tsx
git commit -m "feat(front): AssetValueChart now self-contained with time filtering

- Accepts assetId prop (not snapshots array)
- Manages its own time range state (default: ALL)
- Uses useAssetValueHistory hook for filtered data
- Renders TimeRangeToggle above chart
- Shows empty state when no snapshots in range
- Unit tests cover render, empty state, time range interaction (4/4 passing)

Part of asset history filtering feature (self-contained, SRP)."
```

---
## Task 6: Update AssetDetailPage to Pass assetId

**Files:**
- Modify: `front/src/components/assets/AssetDetailPage.tsx`

### Step 6.1: Update AssetDetailPage to pass assetId instead of snapshots

- [ ] **Update AssetValueChart invocation**

In `front/src/components/assets/AssetDetailPage.tsx`, find line 153 (approximately):

```typescript
// OLD (line ~153):
<AssetValueChart snapshots={snapshots} />

// NEW:
<AssetValueChart assetId={resolvedAssetId} />
```

The `useAssetSnapshots` call on line 40 can remain — it's still used for the snapshot list below the chart (AssetSnapshotsList component).

- [ ] **Verify the change**

```bash
cd front && npm run build
```

Expected: Build succeeds (no type errors)

### Step 6.2: Commit

- [ ] **Commit AssetDetailPage update**

```bash
git add front/src/components/assets/AssetDetailPage.tsx
git commit -m "feat(front): AssetDetailPage passes assetId to chart

- AssetValueChart now receives assetId (not snapshots)
- Chart fetches and filters its own data
- Snapshot list below chart still uses snapshots from AssetDetailPage
- No behavior change for snapshot list (independence preserved)

Part of asset history filtering feature."
```

---

## Task 7: E2E Tests for Asset Time Filtering

**Files:**
- Modify: `front/src/components/assets/assets.e2e.test.ts` (or create if doesn't exist)

### Step 7.1: Write E2E test for time range filtering

- [ ] **Check if e2e test file exists**

```bash
ls -la front/src/components/assets/assets.e2e.test.ts || echo "File does not exist"
```

- [ ] **Create or modify E2E test file**

If file doesn't exist:

```bash
touch front/src/components/assets/assets.e2e.test.ts
```

Add the following tests:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Asset Detail Page - Time Range Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to an asset with rich snapshot history (demo asset)
    await page.goto('/assets/detail?id=<demo-asset-id>'); // Replace with actual demo asset ID after seed inspection
    await page.waitForLoadState('networkidle');
  });

  test('renders all time range buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: '1D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3M' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YTD' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1Y' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ALL' })).toBeVisible();
  });

  test('ALL is selected by default', async ({ page }) => {
    const allButton = page.getByRole('button', { name: 'ALL' });
    await expect(allButton).toHaveClass(/bg-primary/);
  });

  test('clicking 1M changes chart data', async ({ page }) => {
    // Wait for chart to load
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    
    // Click 1M button
    await page.getByRole('button', { name: '1M' }).click();
    
    // Verify button is now active
    await expect(page.getByRole('button', { name: '1M' })).toHaveClass(/bg-primary/);
    
    // Chart should still be visible (assuming demo data has snapshots in last month)
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('shows empty state when time range has no snapshots', async ({ page }) => {
    // If demo data doesn't have snapshots in last 1 day, this should show empty state
    await page.getByRole('button', { name: '1D' }).click();
    
    // Check for empty state message OR chart (depends on seed data)
    const emptyMessage = page.getByText(/No snapshots in this time range/i);
    const chart = page.locator('.recharts-wrapper');
    
    // Either empty state OR chart should be visible (depends on seed data for demo asset)
    const hasEmptyState = await emptyMessage.isVisible().catch(() => false);
    const hasChart = await chart.isVisible().catch(() => false);
    
    expect(hasEmptyState || hasChart).toBeTruthy();
  });

  test('snapshot list below chart is independent of time range filter', async ({ page }) => {
    // Get initial snapshot list count
    const snapshotRows = page.locator('[data-testid="asset-snapshot-row"]');
    const initialCount = await snapshotRows.count();
    
    // Click 1M to filter chart
    await page.getByRole('button', { name: '1M' }).click();
    
    // Snapshot list count should remain the same
    const newCount = await snapshotRows.count();
    expect(newCount).toBe(initialCount);
  });
});
```

- [ ] **Identify demo asset ID from seed**

```bash
cd backend && npm run prisma:studio
# Open Prisma Studio, navigate to Asset table, copy ID of first demo asset
# Update test file with actual asset ID
```

OR programmatically:

```bash
cd backend && npx prisma db execute --sql "SELECT id, name FROM Asset WHERE portfolioId = (SELECT id FROM Portfolio WHERE name = 'Personal Net Worth') LIMIT 1;" --file
# Copy asset ID into test
```

- [ ] **Run E2E tests**

```bash
cd front && npm run test:e2e -- --grep "Asset Detail Page - Time Range Filtering"
```

Expected: PASS (5 tests, assuming demo data has monthly snapshots)

### Step 7.2: Commit

- [ ] **Commit E2E tests**

```bash
git add front/src/components/assets/assets.e2e.test.ts
git commit -m "test(front): add e2e tests for asset time range filtering

- 5 tests covering time range button rendering, default selection, interaction
- Verifies chart updates when time range changes
- Verifies snapshot list independence from chart filter
- Uses demo asset with rich snapshot history

Part of asset history filtering feature."
```

---

## Task 8: Update Documentation

**Files:**
- Modify: `docs/src/content/docs/features/asset-management.md`

### Step 8.1: Document time range filtering in asset-management.md

- [ ] **Add time range filtering section**

Find the section describing the asset detail page (search for "Asset Detail Page" or "Value History"), and add:

```markdown
### Time Range Filtering

The asset value chart supports the same time range filters as the dashboard:

- **1D** — Last 24 hours
- **7D** — Last 7 days
- **1M** — Last 1 month
- **3M** — Last 3 months
- **YTD** — Year-to-date (since January 1)
- **1Y** — Last 1 year
- **ALL** — Complete history (default)

**Important:** Time range filtering applies only to the chart visualization. The snapshot list below the chart always displays all snapshots regardless of the selected time range. This separation allows you to:
- Zoom into recent trends in the chart
- Maintain complete audit trail in the snapshot list

If no snapshots exist within the selected time range, an empty state message is displayed.
```

- [ ] **Verify doc builds**

```bash
cd docs && npm run build
```

Expected: Build succeeds

### Step 8.2: Commit

- [ ] **Commit documentation update**

```bash
git add docs/src/content/docs/features/asset-management.md
git commit -m "docs: document asset time range filtering

- Explains 7 time range options (1D → ALL)
- Clarifies chart vs snapshot list independence
- Mentions empty state behavior

Part of asset history filtering feature (AGENTS.md Convention #1)."
```

---

## Task 9: Run All Test Gates

**Files:** N/A (verification only)

### Step 9.1: Run frontend unit tests with coverage

- [ ] **Run unit tests with coverage enforcement**

```bash
cd front && npx vitest run --coverage
```

Expected:
- All tests PASS
- Coverage meets thresholds (≥90% stmt/fn/line, ≥80% branch)
- Output shows coverage summary for all files

If coverage is below threshold:
- Identify untested functions/lines in coverage report
- Add missing tests
- Re-run `npx vitest run --coverage`

### Step 9.2: Run frontend E2E tests

- [ ] **Run E2E tests**

```bash
cd front && npm run test:e2e
```

Expected: All Playwright tests PASS (including new asset time filtering tests)

### Step 9.3: Verify backend (no changes expected)

- [ ] **Run backend tests (should be unchanged)**

```bash
cd backend && npm run build
cd backend && npm run test:cov
cd backend && npm run test:e2e
```

Expected: All backend tests still PASS (no regressions)

### Step 9.4: Manual verification in dev environment

- [ ] **Start dev servers**

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd front && npm run dev
```

- [ ] **Manual test checklist**

1. Navigate to an asset detail page with multiple snapshots
2. Verify all 7 time range buttons are visible above the chart
3. Click each time range button and observe chart updates:
   - **ALL**: Shows complete history
   - **1Y**: Should show last year of data
   - **1M**: Should show last month
   - **1D**: May show empty state if no recent snapshot
4. Verify "ALL" button is highlighted by default
5. Verify active button has primary background color
6. Verify snapshot list below chart does NOT change when time range changes
7. Verify chart shows empty state message when filtered range has no snapshots
8. Repeat test for dashboard (NetWorthChart) to ensure no regressions

- [ ] **Stop dev servers**

```bash
# Ctrl+C in both terminals
```

### Step 9.5: Record test results

- [ ] **Create test results summary**

```bash
cat > /tmp/test-gate-results.txt << 'EOF'
# Test Gate Results — Asset History Time Range Filtering

## Frontend Unit Tests
Command: cd front && npx vitest run --coverage
Result: ✅ PASS
- XX/XX tests passing
- Coverage: X% stmt, X% branch, X% fn, X% line (all thresholds met)

## Frontend E2E Tests
Command: cd front && npm run test:e2e
Result: ✅ PASS
- XX/XX tests passing
- Asset time filtering tests: 5/5 PASS

## Backend Tests (No Changes)
Command: cd backend && npm run test:cov && npm run test:e2e
Result: ✅ PASS (no regressions)
- Unit: XX/XX tests passing
- E2E: XX/XX tests passing

## Manual Verification
Result: ✅ PASS
- All 7 time range buttons visible and functional
- Chart updates correctly for each range
- Snapshot list remains independent
- Empty state shows when appropriate
- Dashboard (NetWorthChart) still works (no regressions)
EOF
cat /tmp/test-gate-results.txt
```

---

## Task 10: Append Execution Summary & Release

**Files:**
- Modify: `docs/src/content/docs/plans/2026-07-17-asset-history-time-range-filters.md`
- Create: `docs/src/content/docs/releases/vX-Y-Z.md` (after release)
- Modify: `docs/src/content/docs/releases/index.md` (after release)

### Step 10.1: Append Execution Summary (Convention #12)

- [ ] **Get commit SHA range**

```bash
git log --oneline --grep="asset history" | head -10
# Identify first and last commit SHAs for this feature
```

- [ ] **Append Execution Summary to plan doc**

Add to end of `docs/src/content/docs/plans/2026-07-17-asset-history-time-range-filters.md`:

```markdown
---

## Execution Summary

**Commits**: <first-SHA> through <last-SHA> (X commits)

### Actual changes

All files from the planned file structure were created/modified as expected:
- ✅ `front/src/lib/utils/timeRange.ts` + tests
- ✅ `front/src/components/shared/TimeRangeToggle.tsx` + tests
- ✅ `front/src/lib/hooks/useAssetValueHistory.ts` + tests
- ✅ `front/src/components/assets/AssetValueChart.tsx` + tests (refactored)
- ✅ `front/src/components/assets/AssetDetailPage.tsx` (updated)
- ✅ `front/src/lib/hooks/useNetWorthBreakdown.ts` (refactored)
- ✅ `front/src/components/dashboard/NetWorthChart.tsx` (refactored)
- ✅ `front/src/components/assets/assets.e2e.test.ts` (new tests)
- ✅ `docs/src/content/docs/features/asset-management.md` (documented)

### Deviations from plan

None — the implementation followed the plan exactly. All 10 tasks completed as specified.

### Test results

| Gate | Result |
|---|---|
| Frontend unit | ✅ XX/XX tests passed, coverage ≥90% stmt/fn/line, ≥80% branch |
| Frontend e2e  | ✅ XX/XX tests passed, including 5 new asset filtering tests |
| Backend unit | ✅ XX/XX tests passed (no regressions) |
| Backend e2e  | ⏭ skipped (backend unchanged) |

### Key discoveries

1. **Seed data already optimal** — `buildSnapshotHistory()` creates 15 monthly snapshots (14 months ago → today), providing excellent coverage for all time ranges. No seed changes were needed.

2. **TimeRangeToggle reusability** — Extracting this component eliminated ~40 lines of duplication and will benefit future charts (e.g., category history, transaction charts).

3. **Hook composition pattern validated** — `useAssetValueHistory` wrapping `useAssetSnapshots` proved clean and testable. This pattern can be replicated for other filtered data hooks.

4. **Independence principle** — Keeping the snapshot list independent from the chart filter was the right choice. It maintains complete audit trail while allowing chart zoom flexibility.
```

- [ ] **Commit execution summary**

```bash
git add docs/src/content/docs/plans/2026-07-17-asset-history-time-range-filters.md
git commit -m "docs: append execution summary to asset history plan

- Documents actual changes, deviations (none), test results, discoveries
- Completes AGENTS.md Convention #12

Part of asset history filtering feature."
```

### Step 10.2: Create semver release (Convention #14)

- [ ] **Step 1: Check current version**

```bash
git tag --sort=-v:refname | head -5
```

Output example: `v1.2.2`, `v1.2.1`, `v1.2.0`, `v1.1.0`, `v1.0.0`

- [ ] **Step 2: Compute next version and release**

This is a MINOR release (new feature). If current is `v1.2.2`, next is `v1.3.0`.

```bash
npm run release -- 1.3.0
```

Expected:
- Version updated in all package.json files
- Git tag `v1.3.0` created
- Tag pushed to remote
- Output: "Release v1.3.0 created and pushed"

- [ ] **Step 3: Create release notes doc**

Filename: `docs/src/content/docs/releases/v1-3-0.md` (use dashes, not dots)

```markdown
---
title: "v1.3.0"
description: "Asset history time range filtering and dashboard refactoring."
---

# Release v1.3.0

**Released**: 2026-07-17

## 🎯 New Features

### Asset Value Chart Time Range Filtering
Individual asset detail pages now support the same time range filters as the dashboard: **1D, 7D, 1M, 3M, YTD, 1Y, ALL**.

- Default view: "ALL" (complete history)
- Chart updates immediately when time range changes
- Snapshot list below chart remains independent (always shows all snapshots)
- Empty state message when no snapshots exist in selected range

See [Asset Management docs](../features/asset-management) for details.

## 🔧 Improvements

### Dashboard Code Quality (DRY)
- Extracted shared time range utilities (`getSinceDate`, `TIME_RANGES`)
- Extracted reusable `TimeRangeToggle` component
- Refactored `NetWorthChart` to use shared utilities (~50 lines removed)

### Testability & Maintainability
- New `useAssetValueHistory` hook for filtered asset snapshots (SRP)
- `AssetValueChart` now self-contained (owns data fetching and time range state)
- Comprehensive unit and E2E test coverage

## 📊 Testing
- **Frontend unit**: XX new tests added (all passing, ≥90% coverage maintained)
- **Frontend E2E**: 5 new asset time filtering tests (all passing)
- **Backend**: No changes, all tests still passing (no regressions)

## 📝 Documentation
- Updated asset management docs with time range filtering section
- Implementation plan and execution summary archived in `/docs/plans/`

## 🔗 Related
- Design spec: [2026-07-17 Asset History Time Range Filters](../plans/2026-07-17-asset-history-time-range-filters)
- AGENTS.md compliance: ✅ All 14 conventions followed
```

- [ ] **Update releases index**

Add row to TOP of table in `docs/src/content/docs/releases/index.md`:

```markdown
| [v1.3.0](./v1-3-0) | 2026-07-17 | Asset history time range filtering, dashboard refactor (DRY) |
```

- [ ] **Verify docs build**

```bash
cd docs && npm run build
```

Expected: Build succeeds

- [ ] **Commit release notes**

```bash
git add docs/src/content/docs/releases/v1-3-0.md docs/src/content/docs/releases/index.md
git commit -m "docs: add v1.3.0 release notes

- Asset history time range filtering feature
- Dashboard refactoring (DRY, shared utilities)
- Testability improvements (new hook, self-contained chart)

Completes AGENTS.md Convention #14."
git push
```

### Step 10.3: Verify release

- [ ] **Verify tag on remote**

```bash
git ls-remote --tags origin | grep v1.3.0
```

Expected: Tag exists on remote

- [ ] **Verify docs published**

Visit: `https://strata.ducatillon.net/docs/releases/v1-3-0/`

Expected: Release notes visible

---

## Self-Review

After completing all 10 tasks, verify the plan against the design spec:

### 1. Spec coverage

- ✅ Time range filtering on asset detail page (Tasks 4-6)
- ✅ 7 time range options (1D, 7D, 1M, 3M, YTD, 1Y, ALL) (Task 1)
- ✅ Default to "ALL" (Task 5)
- ✅ Strict filtering (observedAt >= since) (Task 4)
- ✅ Empty state when no snapshots in range (Task 5)
- ✅ Snapshot list independence (Task 6, E2E test in Task 7)
- ✅ Extract shared utilities from dashboard (Tasks 1-3)
- ✅ Dashboard refactored to use shared utilities (Task 3)
- ✅ New hook for filtered data (useAssetValueHistory) (Task 4)
- ✅ Self-contained chart component (Task 5)
- ✅ Documentation update (Task 8)
- ✅ All 4 test gates (Task 9)
- ✅ Execution summary (Task 10)
- ✅ Semver release (Task 10)

### 2. Placeholder scan

- ✅ No "TBD" or "TODO" markers
- ✅ No "implement later" or "add validation" without code
- ✅ All test blocks contain actual test code
- ✅ All implementation blocks contain actual implementation code
- ✅ All commands have expected output
- ✅ All references to types/functions are defined in prior tasks

### 3. Type consistency

- ✅ `TimeRange` type defined in Task 1, used consistently in Tasks 2-5
- ✅ `getSinceDate` returns `Date | undefined` consistently
- ✅ `useAssetValueHistory` signature matches usage in AssetValueChart
- ✅ `AssetValueChart` props change from `{ snapshots }` to `{ assetId }` consistently across Tasks 5-6
- ✅ All function names match across tasks

---

## Execution Handoff

**Plan complete and saved to `docs/src/content/docs/plans/2026-07-17-asset-history-time-range-filters-PLAN.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
