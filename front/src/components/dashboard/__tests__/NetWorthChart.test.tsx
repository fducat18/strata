import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/hooks', () => ({
  FILTER_MODES: ['total', 'by-group', 'by-type', 'by-category'],
  TIME_RANGES: ['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'],
  useNetWorthBreakdown: vi.fn(),
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
  AreaChart: ({ children, data }: { children: ReactNode; data: Record<string, number | string>[] }) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Area: ({ dataKey }: { dataKey: string }) => <div data-testid={`series-${dataKey}`} />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}));

import { NetWorthChart } from '../NetWorthChart';
import { useNetWorthBreakdown } from '@/lib/hooks';

const mockUseNetWorthBreakdown = vi.mocked(useNetWorthBreakdown);

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
    mockUseNetWorthBreakdown.mockReturnValue({ data: [], keys: [], keyColors: {} });
  });

  it('shows message when no data', () => {
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByText(/No portfolio history yet/)).toBeInTheDocument();
    expect(screen.getByText(/Add assets with acquisition dates/)).toBeInTheDocument();
  });

  it('does not mention Take Snapshot in empty state', () => {
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.queryByText(/Take Snapshot/)).not.toBeInTheDocument();
  });

  it('shows 4 filter mode buttons and 7 time range buttons', () => {
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Net Worth' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'By Group' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'By Type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'By Category' })).toBeInTheDocument();
    // Time range buttons
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
  });

  it('renders chart container when data exists', () => {
    mockUseNetWorthBreakdown.mockReturnValue({
      data: [{ date: '2024-01-01T00:00:00Z', Assets: 10000, Liabilities: 0 }],
      keys: ['Assets', 'Liabilities'],
      keyColors: { Assets: '#22c55e', Liabilities: '#ef4444' },
    });
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('toggles multiple category series and recalculates chart data from visible categories', () => {
    mockUseNetWorthBreakdown.mockReturnValue({
      data: [{
        date: '2024-01-01T00:00:00Z',
        Banking: 1000,
        Financial: 25000,
        Other: 1000000,
      }],
      keys: ['Banking', 'Financial', 'Other'],
      keyColors: { Banking: '#3b82f6', Financial: '#22c55e', Other: '#f97316' },
    });
    render(<NetWorthChart />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'By Category' }));

    const banking = screen.getByRole('button', { name: 'Banking' });
    const financial = screen.getByRole('button', { name: 'Financial' });
    const other = screen.getByRole('button', { name: 'Other' });
    expect(banking).toHaveAttribute('aria-pressed', 'true');
    expect(financial).toHaveAttribute('aria-pressed', 'true');
    expect(other).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(other);
    expect(other).toHaveAttribute('aria-pressed', 'false');
    expect(banking).toHaveAttribute('aria-pressed', 'true');
    expect(financial).toHaveAttribute('aria-pressed', 'true');

    const chartData = JSON.parse(
      screen.getByTestId('area-chart').getAttribute('data-chart-data') ?? '[]',
    );
    expect(chartData[0]).toMatchObject({ Banking: 1000, Financial: 25000 });
    expect(chartData[0]).not.toHaveProperty('Other');
    expect(screen.queryByTestId('series-Other')).not.toBeInTheDocument();

    fireEvent.click(banking);
    expect(banking).toHaveAttribute('aria-pressed', 'false');
    expect(financial).toHaveAttribute('aria-pressed', 'true');

    const narrowedChartData = JSON.parse(
      screen.getByTestId('area-chart').getAttribute('data-chart-data') ?? '[]',
    );
    expect(narrowedChartData[0]).toMatchObject({ Financial: 25000 });
    expect(narrowedChartData[0]).not.toHaveProperty('Banking');
    expect(narrowedChartData[0]).not.toHaveProperty('Other');
  });

  it('calls useNetWorthBreakdown with mode when toggle clicked', () => {
    render(<NetWorthChart />, { wrapper: createWrapper() });
    const byGroupBtn = screen.getByRole('button', { name: 'By Group' });
    fireEvent.click(byGroupBtn);
    expect(mockUseNetWorthBreakdown).toHaveBeenCalledWith('by-group', undefined);
  });
});
