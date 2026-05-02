import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useAssets: vi.fn(),
  useCurrentPortfolioValue: vi.fn(),
  usePortfolioSnapshots: vi.fn(),
  FILTER_MODES: ['total', 'by-group', 'by-type', 'by-category'],
  TIME_RANGES: ['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'],
  useNetWorthBreakdown: vi.fn(() => ({ data: [], keys: [], keyColors: {} })),
}));

vi.mock('@/stores/settingsStore', () => ({
  useLocale: vi.fn(() => 'en-US'),
  useCurrency: vi.fn(() => 'EUR'),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

import { DashboardPage } from '../DashboardPage';
import { useAssets, useCurrentPortfolioValue, usePortfolioSnapshots } from '@/lib/hooks';

const mockUseAssets = vi.mocked(useAssets);
const mockUseCurrentPortfolioValue = vi.mocked(useCurrentPortfolioValue);
const mockUsePortfolioSnapshots = vi.mocked(usePortfolioSnapshots);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolioSnapshots.mockReturnValue({ data: [], isLoading: false } as any);
  });

  it('shows loading when fetching', () => {
    mockUseAssets.mockReturnValue({ isLoading: true, data: undefined, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: true, data: undefined, isError: false, refetch: vi.fn() } as any);
    render(<DashboardPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when assets fail to load', () => {
    mockUseAssets.mockReturnValue({ isLoading: false, data: undefined, isError: true, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: undefined, isError: false, refetch: vi.fn() } as any);
    render(<DashboardPage />);
    expect(screen.getByText('Failed to load dashboard data.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders dashboard with data', () => {
    const assets = [
      { id: 'a1', name: 'AAPL', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' }, categories: [], tags: [], quantity: '10', createdAt: '', updatedAt: '', currentValue: '50000' },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '50000', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // 'Net Worth' appears as stat card title and as chart mode button
    expect(screen.getAllByText('Net Worth').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
  });

  it('renders clickable link on Total Assets card', () => {
    const assets = [
      { id: 'a1', name: 'AAPL', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' }, categories: [], tags: [], quantity: '10', createdAt: '', updatedAt: '', currentValue: '50000' },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '50000', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);

    const assetsLink = screen.getByText('Total Assets').closest('a');
    expect(assetsLink).toHaveAttribute('href', '/assets');

    // Total Liabilities card should also be wrapped in a link
    const liabLink = screen.getByText('Total Liabilities').closest('a');
    expect(liabLink).toHaveAttribute('href', '/asset-types');
  });

  it('does not render a Take Snapshot button', () => {
    mockUseAssets.mockReturnValue({ isLoading: false, data: [], isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '0', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);
    render(<DashboardPage />);
    expect(screen.queryByRole('button', { name: /Take Snapshot/i })).not.toBeInTheDocument();
  });

  it('filters out disposed assets', () => {
    const assets = [
      { id: 'a1', name: 'AAPL', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '', currentValue: null },
      { id: 'a2', name: 'MSFT', disposed: true, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '', currentValue: null },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '0', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);
    // 1 active asset (AAPL), shown in subtitle "1 active asset"
    expect(screen.getByText('1 active asset')).toBeInTheDocument();
  });

  it('shows liabilities as negative value in Total Liabilities card', () => {
    const assets = [
      { id: 'a1', name: 'Savings', disposed: false, assetType: { code: 'SAVINGS', label: 'Savings', group: 'FINANCIAL' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '', currentValue: '100000' },
      { id: 'a2', name: 'Mortgage', disposed: false, assetType: { code: 'MORTGAGE', label: 'Mortgage', group: 'LIABILITIES' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '', currentValue: '200000' },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '-100000', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);
    // Liabilities card should show negative indicator
    const liabCard = screen.getByText('Total Liabilities').closest('a');
    expect(liabCard).toBeInTheDocument();
    // The liability value should have the negative prefix (−)
    expect(screen.getByText(/−/)).toBeInTheDocument();
  });
});
