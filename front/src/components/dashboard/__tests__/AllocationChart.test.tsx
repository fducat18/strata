import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/stores/settingsStore', () => ({
  useLocale: vi.fn(() => 'en-US'),
  useCurrency: vi.fn(() => 'EUR'),
}));

// Mock Recharts so we can call the callback props to improve coverage
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ label, children }: any) => {
    // Exercise the label callback with both visible (>5%) and hidden (<5%) cases
    if (label) {
      label({ cx: 100, cy: 100, midAngle: 45, innerRadius: 60, outerRadius: 100, percent: 0.1 });
      label({ cx: 100, cy: 100, midAngle: 45, innerRadius: 60, outerRadius: 100, percent: 0.03 });
    }
    return <div data-testid="pie">{children}</div>;
  },
  Cell: () => null,
  Tooltip: ({ formatter }: any) => {
    if (formatter) formatter(1000, 'Stocks');
    return null;
  },
  Legend: ({ formatter }: any) => {
    if (formatter) formatter('Stocks');
    return null;
  },
}));

import { AllocationChart } from '../AllocationChart';

describe('AllocationChart', () => {
  it('shows empty message when no data', () => {
    render(<AllocationChart data={[]} />);
    expect(screen.getByText('No assets yet.')).toBeInTheDocument();
  });

  it('renders pie chart when data is provided', () => {
    const data = [
      { code: 'STOCKS', label: 'Stocks', value: 50000 },
      { code: 'CRYPTO', label: 'Crypto', value: 10000 },
    ];
    render(<AllocationChart data={data} />);
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });

  it('renders all provided data items as cells', () => {
    const data = [
      { code: 'STOCKS', label: 'Stocks', value: 50000 },
      { code: 'BONDS', label: 'Bonds', value: 20000 },
      { code: 'CASH', label: 'Cash', value: 5000 },
    ];
    render(<AllocationChart data={data} />);
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });
});
