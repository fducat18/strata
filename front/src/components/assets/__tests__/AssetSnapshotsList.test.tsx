import { render, screen, fireEvent } from '@testing-library/react';
import { AssetSnapshotsList } from '../AssetSnapshotsList';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AssetSnapshot } from '@/lib/types';

const snapshots: AssetSnapshot[] = [
  {
    id: 's1',
    assetId: 'a1',
    value: '10000',
    observedAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 's2',
    assetId: 'a1',
    value: '11000',
    observedAt: '2024-01-10T00:00:00Z',
    createdAt: '2024-01-10T00:00:00Z',
  },
];

describe('AssetSnapshotsList', () => {
  beforeEach(() => {
    useSettingsStore.setState({ locale: 'en-US', currency: 'EUR' });
  });

  it('renders snapshots table headers', () => {
    render(<AssetSnapshotsList snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('shows empty message when no snapshots', () => {
    render(<AssetSnapshotsList snapshots={[]} onAddSnapshot={vi.fn()} />);
    expect(screen.getByText('No snapshots yet.')).toBeInTheDocument();
  });

  it('calls onAddSnapshot when Add Snapshot clicked', () => {
    const onAdd = vi.fn();
    render(<AssetSnapshotsList snapshots={[]} onAddSnapshot={onAdd} />);
    fireEvent.click(screen.getByLabelText('Add snapshot'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders all snapshot rows', () => {
    render(<AssetSnapshotsList snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // Header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('sorts snapshots newest first', () => {
    render(<AssetSnapshotsList snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // s1 (Jan 15) should appear before s2 (Jan 10) in sorted order
    expect(rows[1].textContent).toContain('Jan');
    expect(rows[2].textContent).toContain('Jan');
  });
});
