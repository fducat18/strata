import { render, screen } from '@testing-library/react';
import { AssetValueChart } from '../AssetValueChart';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AssetSnapshot } from '@/lib/types';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

const snapshots: AssetSnapshot[] = [
  { id: 's1', assetId: 'a1', value: '10000', observedAt: '2024-01-15T00:00:00Z', createdAt: '' },
  { id: 's2', assetId: 'a1', value: '11000', observedAt: '2024-01-20T00:00:00Z', createdAt: '' },
];

describe('AssetValueChart', () => {
  beforeEach(() => {
    useSettingsStore.setState({ locale: 'en-US', currency: 'EUR' });
  });

  it('returns null when no snapshots', () => {
    const { container } = render(<AssetValueChart snapshots={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders chart title when snapshots provided', () => {
    render(<AssetValueChart snapshots={snapshots} />);
    expect(screen.getByText('Value History')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    render(<AssetValueChart snapshots={snapshots} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders with single snapshot', () => {
    render(<AssetValueChart snapshots={[snapshots[0]]} />);
    expect(screen.getByText('Value History')).toBeInTheDocument();
  });
});
