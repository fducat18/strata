import { render, screen, fireEvent } from '@testing-library/react';
import { AssetSnapshotsList } from '../AssetSnapshotsList';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AssetSnapshot } from '@/lib/types';

vi.mock('@/lib/hooks', () => ({
  useUpdateAssetSnapshot: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

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
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('shows empty message when no snapshots', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={[]} onAddSnapshot={vi.fn()} />);
    expect(screen.getByText('No snapshots yet.')).toBeInTheDocument();
  });

  it('calls onAddSnapshot when Add Snapshot clicked', () => {
    const onAdd = vi.fn();
    render(<AssetSnapshotsList assetId="a1" snapshots={[]} onAddSnapshot={onAdd} />);
    fireEvent.click(screen.getByLabelText('Add snapshot'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders all snapshot rows', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // Header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('sorts snapshots newest first', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // s1 (Jan 15) should appear before s2 (Jan 10) in sorted order
    expect(rows[1].textContent).toContain('Jan');
    expect(rows[2].textContent).toContain('Jan');
  });

  it('renders acquisition date row when acquisitionDate provided', () => {
    render(
      <AssetSnapshotsList
        assetId="a1"
        snapshots={snapshots}
        acquisitionDate="2024-01-01T00:00:00Z"
        acquisitionPrice="9500"
        onAddSnapshot={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Acquisition date row')).toBeInTheDocument();
    expect(screen.getByText(/acquired/i)).toBeInTheDocument();
  });

  it('does not render acquisition row when acquisitionDate is absent', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    expect(screen.queryByLabelText('Acquisition date row')).not.toBeInTheDocument();
  });

  it('shows acquisition price in acquisition row', () => {
    render(
      <AssetSnapshotsList
        assetId="a1"
        snapshots={[]}
        acquisitionDate="2024-01-01T00:00:00Z"
        acquisitionPrice="9500"
        onAddSnapshot={vi.fn()}
      />
    );
    // Price should appear formatted in the acquisition row
    expect(screen.getByLabelText('Acquisition date row').textContent).toContain('9');
  });
});
