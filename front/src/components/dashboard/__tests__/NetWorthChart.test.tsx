import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/hooks', () => ({
  usePortfolioSnapshots: vi.fn(),
}));

vi.mock('@/stores/settingsStore', () => ({
  useLocale: vi.fn(() => 'en-US'),
  useCurrency: vi.fn(() => 'EUR'),
  useSettingsStore: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="chart-container">{children}</div>
  ),
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import { NetWorthChart } from '../NetWorthChart';
import { usePortfolioSnapshots } from '@/lib/hooks';

const mockUsePortfolioSnapshots = vi.mocked(usePortfolioSnapshots);

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('NetWorthChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePortfolioSnapshots.mockReturnValue({ data: [] } as any);
  });

  it('shows message when no snapshots', () => {
    mockUsePortfolioSnapshots.mockReturnValue({ data: [] } as any);
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByText(/No portfolio history yet/)).toBeInTheDocument();
  });

  it('shows message when snapshots is undefined', () => {
    mockUsePortfolioSnapshots.mockReturnValue({ data: undefined } as any);
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByText(/No portfolio history yet/)).toBeInTheDocument();
  });

  it('renders chart when snapshots exist', () => {
    const snapshots = [
      {
        id: 's1',
        value: '10000',
        currency: 'EUR',
        observedAt: '2024-01-01T00:00:00Z',
        createdAt: '',
      },
      {
        id: 's2',
        value: '11000',
        currency: 'EUR',
        observedAt: '2024-01-15T00:00:00Z',
        createdAt: '',
      },
    ];
    mockUsePortfolioSnapshots.mockReturnValue({ data: snapshots } as any);
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });
});
