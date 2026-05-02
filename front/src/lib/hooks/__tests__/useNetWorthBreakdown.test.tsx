import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../assets', () => ({ useAssets: vi.fn() }));
vi.mock('../portfolio-snapshots', () => ({ usePortfolioSnapshots: vi.fn() }));

import { useNetWorthBreakdown, GROUP_COLORS, FILTER_MODES } from '../useNetWorthBreakdown';
import { useAssets } from '../assets';
import { usePortfolioSnapshots } from '../portfolio-snapshots';

const mockUseAssets = vi.mocked(useAssets);
const mockUsePortfolioSnapshots = vi.mocked(usePortfolioSnapshots);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const mockAssets = [
  {
    id: 'a1',
    name: 'Checking Account',
    disposed: false,
    assetType: { id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
    categories: [{ id: 'c1', name: 'Banking', parentId: null }],
    tags: [],
    quantity: '1',
    snapshots: [{ id: 's1', assetId: 'a1', value: '5000.00', observedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01' }],
    transactions: [],
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    currentValue: '5000.00',
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

const mockPortfolioSnapshots = [
  { id: 'ps1', value: '-45000.00', currency: 'EUR', notes: null, observedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01' },
  { id: 'ps2', value: '-44000.00', currency: 'EUR', notes: null, observedAt: '2025-02-01T00:00:00.000Z', createdAt: '2025-02-01' },
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
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.data).toEqual([]);
    expect(result.current.keys).toEqual([]);
  });

  it('returns empty when portfolio snapshots are undefined', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: undefined } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.data).toEqual([]);
  });

  it('returns empty when portfolio snapshots are empty', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: [] } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.data).toEqual([]);
  });

  it('computes total mode with positive and negative buckets', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    expect(result.current.keys).toContain('Assets');
    expect(result.current.keys).toContain('Liabilities');
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].Assets).toBe(5000);
    expect(result.current.data[0].Liabilities).toBe(-50000);
    expect(result.current.keyColors['Assets']).toBe('#22c55e');
    expect(result.current.keyColors['Liabilities']).toBe('#ef4444');
  });

  it('computes by-group mode', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('by-group'), { wrapper: createWrapper() });
    expect(result.current.keys).toContain('FINANCIAL');
    expect(result.current.keys).toContain('LIABILITIES');
    expect(result.current.data[0]['FINANCIAL']).toBe(5000);
    expect(result.current.data[0]['LIABILITIES']).toBe(-50000);
    expect(result.current.keyColors['FINANCIAL']).toBe(GROUP_COLORS['FINANCIAL']);
    expect(result.current.keyColors['LIABILITIES']).toBe(GROUP_COLORS['LIABILITIES']);
  });

  it('computes by-type mode', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('by-type'), { wrapper: createWrapper() });
    expect(result.current.keys).toContain('CHECKING_ACCOUNT');
    expect(result.current.keys).toContain('LOAN');
    expect(result.current.data[0]['CHECKING_ACCOUNT']).toBe(5000);
    expect(result.current.data[0]['LOAN']).toBe(-50000);
  });

  it('computes by-category mode — uses category name for grouped buckets', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('by-category'), { wrapper: createWrapper() });
    // a1 has category 'Banking'; a2 has no category → 'Uncategorized'
    expect(result.current.keys).toContain('Banking');
    expect(result.current.keys).toContain('Uncategorized');
    expect(result.current.data[0]['Banking']).toBe(5000);
    expect(result.current.data[0]['Uncategorized']).toBe(-50000);
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
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    // disposed asset's value should NOT be included
    expect(result.current.data[0].Assets).toBe(5000);
  });

  it('returns 0 for asset with no snapshots at or before the date', () => {
    const futureAssets = [
      {
        id: 'a4',
        name: 'Future Asset',
        disposed: false,
        assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
        categories: [],
        tags: [],
        quantity: '1',
        snapshots: [{ id: 's4', assetId: 'a4', value: '9000.00', observedAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01' }],
        transactions: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        currentValue: null,
      },
    ];
    mockUseAssets.mockReturnValue({ data: futureAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total'), { wrapper: createWrapper() });
    // snapshot is in 2026, portfolio snapshot dates are 2025-01 and 2025-02 → value = 0
    expect(result.current.data[0].Assets).toBe(0);
  });

  it('filters portfolio snapshots by since date (time range filter)', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    // since = 2025-02-01 → only the second snapshot (2025-02-01) should be included
    const since = new Date('2025-02-01T00:00:00.000Z');
    const { result } = renderHook(() => useNetWorthBreakdown('total', since), { wrapper: createWrapper() });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].date).toContain('2025-02-01');
  });

  it('returns all snapshots when since is undefined (ALL range)', () => {
    mockUseAssets.mockReturnValue({ data: mockAssets } as any);
    mockUsePortfolioSnapshots.mockReturnValue({ data: mockPortfolioSnapshots } as any);
    const { result } = renderHook(() => useNetWorthBreakdown('total', undefined), { wrapper: createWrapper() });
    expect(result.current.data).toHaveLength(2);
  });
});
