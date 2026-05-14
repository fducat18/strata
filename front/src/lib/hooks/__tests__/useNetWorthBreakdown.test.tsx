import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../assets', () => ({ useAssets: vi.fn() }));

import { useNetWorthBreakdown, GROUP_COLORS, FILTER_MODES } from '../useNetWorthBreakdown';
import { useAssets } from '../assets';

const mockUseAssets = vi.mocked(useAssets);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

/**
 * Both assets share the same snapshot date (2025-01-01), so there is 1 unique
 * X-axis date. A second snapshot on a1 at 2025-02-01 is used in time-range tests.
 */
const mockAssets = [
  {
    id: 'a1',
    name: 'Checking Account',
    disposed: false,
    assetType: { id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
    categories: [{ id: 'c1', name: 'Banking', parentId: null }],
    tags: [],
    quantity: '1',
    snapshots: [
      { id: 's1', assetId: 'a1', value: '5000.00', observedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01' },
      { id: 's1b', assetId: 'a1', value: '5500.00', observedAt: '2025-02-01T00:00:00.000Z', createdAt: '2025-02-01' },
    ],
    transactions: [],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    currentValue: '5500.00',
  },
  {
    id: 'a2',
    name: 'Home Loan',
    disposed: false,
    assetType: { id: 'at2', code: 'LOAN', label: 'Loan', group: 'LIABILITIES' },
    categories: [],
    tags: [],
    quantity: '1',
    snapshots: [{ id: 's2', assetId: 'a2', value: '50000.00', observedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01' }],
    transactions: [],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    currentValue: '50000.00',
  },
];

describe('FILTER_MODES and GROUP_COLORS exports', () => {
  it('exports the 4 filter modes', () => {
    expect(FILTER_MODES).toEqual(['total', 'by-group', 'by-type', 'by-category']);
  });

  it('exports GROUP_COLORS for all groups', () => {
    expect(GROUP_COLORS).toHaveProperty('FINANCIAL');
    expect(GROUP_COLORS).toHaveProperty('LIABILITIES');
    expect(GROUP_COLORS).toHaveProperty('REAL_ESTATE');
  });
});

describe('useNetWorthBreakdown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty when assets are undefined', () => {
    mockUseAssets.mockReturnValue({ data: undefined } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.data).toEqual([]);
    expect(result.current.keys).toEqual([]);
  });

  it('returns empty when all active assets have no snapshots', () => {
    mockUseAssets.mockReturnValue({
      data: [{ ...mockAssets[0], snapshots: [] }],
    } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.data).toEqual([]);
  });

  it('computes total mode — data points come from asset snapshot dates', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.keys).toContain('Assets');
    expect(result.current.keys).toContain('Liabilities');
    // 2 unique dates: 2025-01-01 and 2025-02-01
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].Assets).toBe(5000);
    expect(result.current.data[0].Liabilities).toBe(-50000);
    expect(result.current.keyColors['Assets']).toBe('#22c55e');
    expect(result.current.keyColors['Liabilities']).toBe('#ef4444');
  });

  it('computes by-group mode — uses GROUP_COLORS (semantic)', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('by-group'), { wrapper: createWrapper() });
    expect(result.current.keys).toContain('FINANCIAL');
    expect(result.current.keys).toContain('LIABILITIES');
    expect(result.current.data[0]['FINANCIAL']).toBe(5000);
    expect(result.current.data[0]['LIABILITIES']).toBe(-50000);
    expect(result.current.keyColors['FINANCIAL']).toBe(GROUP_COLORS['FINANCIAL']);
    expect(result.current.keyColors['LIABILITIES']).toBe(GROUP_COLORS['LIABILITIES']);
  });

  it('computes by-type mode — distinct colors per type, not all the same group color', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('by-type'), { wrapper: createWrapper() });
    expect(result.current.keys).toContain('CHECKING_ACCOUNT');
    expect(result.current.keys).toContain('LOAN');
    expect(result.current.data[0]['CHECKING_ACCOUNT']).toBe(5000);
    expect(result.current.data[0]['LOAN']).toBe(-50000);
    // CHECKING_ACCOUNT and LOAN must have DIFFERENT colors (not both the same group color)
    expect(result.current.keyColors['CHECKING_ACCOUNT']).not.toEqual(
      result.current.keyColors['LOAN'],
    );
  });

  it('computes by-category mode — distinct colors per category', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('by-category'), { wrapper: createWrapper() });
    // a1 has category 'Banking'; a2 has no category → 'Uncategorized'
    expect(result.current.keys).toContain('Banking');
    expect(result.current.keys).toContain('Uncategorized');
    expect(result.current.data[0]['Banking']).toBe(5000);
    expect(result.current.data[0]['Uncategorized']).toBe(-50000);
    // Banking and Uncategorized must have DIFFERENT colors
    expect(result.current.keyColors['Banking']).not.toEqual(
      result.current.keyColors['Uncategorized'],
    );
  });

  it('ignores disposed assets', () => {
    const assetsWithDisposed = [
      ...mockAssets,
      {
        id: 'a3',
        name: 'Old Asset',
        disposed: true,
        assetType: { id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
        categories: [],
        tags: [],
        quantity: '1',
        snapshots: [{ id: 's3', assetId: 'a3', value: '999.00', observedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01' }],
        transactions: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        currentValue: '999.00',
      },
    ];
    mockUseAssets.mockReturnValue({ data: assetsWithDisposed } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    // disposed asset's value should NOT be included (Assets = only a1 at 5000)
    expect(result.current.data[0].Assets).toBe(5000);
  });

  it('returns 0 for an asset at a date before its first snapshot', () => {
    // a1 has snap at 2025-01-01, a2 has snap at 2025-02-01 only
    const assets = [
      { ...mockAssets[0], snapshots: [{ id: 's1', assetId: 'a1', value: '5000.00', observedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01' }] },
      { ...mockAssets[1], snapshots: [{ id: 's2', assetId: 'a2', value: '50000.00', observedAt: '2025-02-01T00:00:00.000Z', createdAt: '2025-02-01' }] },
    ];
    mockUseAssets.mockReturnValue({ data: assets } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    // 2 unique dates: 2025-01-01 and 2025-02-01
    expect(result.current.data).toHaveLength(2);
    // At 2025-01-01: a1=5000, a2 has no snapshot yet → 0 (no liability)
    expect(result.current.data[0].Liabilities).toBe(0);
    // At 2025-02-01: a1=5000 (carries over), a2=50000 (new snapshot)
    expect(result.current.data[1].Liabilities).toBe(-50000);
  });

  it('filters by since date — only asset snapshots on or after that date are included as X-axis points', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    // since = 2025-02-01 → only the 2025-02-01 snapshot of a1 qualifies; a2's 2025-01-01 snapshot is excluded
    const since = new Date('2025-02-01T00:00:00.000Z');
    const { result } = renderHook(() => useNetWorthBreakdown('total', since), { wrapper: createWrapper() });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].date).toContain('2025-02-01');
  });

  it('returns all asset-snapshot dates when since is undefined (ALL range)', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total', undefined), { wrapper: createWrapper() });
    // mockAssets has snapshots at 2025-01-01 and 2025-02-01
    expect(result.current.data).toHaveLength(2);
  });
});
