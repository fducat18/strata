import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useAssets: vi.fn(),
  useCurrentPortfolioValue: vi.fn(),
  useCreatePortfolioSnapshot: vi.fn(),
  usePortfolioSnapshots: vi.fn(),
}));

vi.mock('@/stores/settingsStore', () => ({
  useLocale: vi.fn(() => 'en-US'),
  useCurrency: vi.fn(() => 'EUR'),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: { getState: vi.fn(() => ({ pushToast: vi.fn() })) },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

import { DashboardPage } from '../DashboardPage';
import { useAssets, useCurrentPortfolioValue, useCreatePortfolioSnapshot, usePortfolioSnapshots } from '@/lib/hooks';

const mockUseAssets = vi.mocked(useAssets);
const mockUseCurrentPortfolioValue = vi.mocked(useCurrentPortfolioValue);
const mockUseCreatePortfolioSnapshot = vi.mocked(useCreatePortfolioSnapshot);
const mockUsePortfolioSnapshots = vi.mocked(usePortfolioSnapshots);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolioSnapshots.mockReturnValue({ data: [], isLoading: false } as any);
    mockUseCreatePortfolioSnapshot.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
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
      { id: 'a1', name: 'AAPL', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' }, categories: [], tags: [], quantity: '10', createdAt: '', updatedAt: '' },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '50000', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Active Assets')).toBeInTheDocument();
  });

  it('renders clickable link on Active Assets card', () => {
    const assets = [
      { id: 'a1', name: 'AAPL', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' }, categories: [], tags: [], quantity: '10', createdAt: '', updatedAt: '' },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '50000', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);

    const assetsLink = screen.getByText('Active Assets').closest('a');
    expect(assetsLink).toHaveAttribute('href', '/assets');

    // Asset Types card should NOT be wrapped in a link
    const assetTypesCard = screen.getByText('Asset Types').closest('a');
    expect(assetTypesCard).toBeNull();
  });

  it('renders Take Snapshot button', () => {
    mockUseAssets.mockReturnValue({ isLoading: false, data: [], isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '0', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);
    render(<DashboardPage />);
    const button = screen.getByRole('button', { name: /Take Snapshot/i });
    expect(button).toBeInTheDocument();
  });

  it('filters out disposed assets', () => {
    const assets = [
      { id: 'a1', name: 'AAPL', disposed: false, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '' },
      { id: 'a2', name: 'MSFT', disposed: true, assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' }, categories: [], tags: [], quantity: null, createdAt: '', updatedAt: '' },
    ];
    mockUseAssets.mockReturnValue({ isLoading: false, data: assets, isError: false, refetch: vi.fn() } as any);
    mockUseCurrentPortfolioValue.mockReturnValue({ isLoading: false, data: { value: '0', currency: 'EUR' }, isError: false, refetch: vi.fn() } as any);

    render(<DashboardPage />);
    // Only 1 active asset (AAPL)
    const cards = screen.getAllByText('1');
    expect(cards.length).toBeGreaterThan(0);
  });
});
