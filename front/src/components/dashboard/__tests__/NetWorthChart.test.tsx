import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/hooks', () => ({
  FILTER_MODES: ['total', 'by-group', 'by-type', 'by-category'],
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

  it('shows 4 filter toggle buttons', () => {
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'By Group' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'By Type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'By Category' })).toBeInTheDocument();
  });

  it('renders chart container when data exists', () => {
    mockUseNetWorthBreakdown.mockReturnValue({
      data: [{ date: '2024-01-01T00:00:00Z', positive: 10000, negative: 0 }],
      keys: ['positive', 'negative'],
      keyColors: { positive: '#22c55e', negative: '#ef4444' },
    });
    render(<NetWorthChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('calls useNetWorthBreakdown with mode when toggle clicked', () => {
    render(<NetWorthChart />, { wrapper: createWrapper() });
    const byGroupBtn = screen.getByRole('button', { name: 'By Group' });
    fireEvent.click(byGroupBtn);
    expect(mockUseNetWorthBreakdown).toHaveBeenCalledWith('by-group');
  });
});
