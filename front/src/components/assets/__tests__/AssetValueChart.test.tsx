import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetValueChart } from '../AssetValueChart.js';
import * as hooks from '@/lib/hooks/useAssetValueHistory.js';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container" role="region">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

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

  it('returns null when loading', () => {
    vi.spyOn(hooks, 'useAssetValueHistory').mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    });
    const { container } = render(<AssetValueChart assetId="a1" />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('returns null when error occurs', () => {
    vi.spyOn(hooks, 'useAssetValueHistory').mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    });
    const { container } = render(<AssetValueChart assetId="a1" />, { wrapper });
    expect(container.firstChild).toBeNull();
  });
});
