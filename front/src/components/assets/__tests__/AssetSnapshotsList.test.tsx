import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssetSnapshotsList } from '../AssetSnapshotsList';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AssetSnapshot } from '@/lib/types';

const mockUpdateMutateAsync = vi.fn().mockResolvedValue({});
const mockDeleteMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/lib/hooks', () => ({
  useUpdateAssetSnapshot: vi.fn(() => ({ mutateAsync: mockUpdateMutateAsync, isPending: false })),
  useDeleteAssetSnapshot: vi.fn(() => ({ mutateAsync: mockDeleteMutateAsync, isPending: false })),
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
    mockUpdateMutateAsync.mockReset().mockResolvedValue({});
    mockDeleteMutateAsync.mockReset().mockResolvedValue({});
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

  it('sorts snapshots newest first by default', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // s1 (Jan 15) before s2 (Jan 10)
    expect(rows[1].textContent).toContain('15');
    expect(rows[2].textContent).toContain('10');
  });

  it('toggles sort to ascending when Date header clicked', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/sort by date/i));
    const rows = screen.getAllByRole('row');
    // After toggle asc: s2 (Jan 10) before s1 (Jan 15)
    expect(rows[1].textContent).toContain('10');
    expect(rows[2].textContent).toContain('15');
  });

  it('renders snapshot dates without time', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    // No colon in time format — dates should not contain "02:00" or similar
    const rows = screen.getAllByRole('row');
    expect(rows[1].textContent).not.toMatch(/\d{2}:\d{2}/);
  });

  it('renders snapshot values with no decimal places', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    // 10000 formatted without decimals — should not contain ".00"
    expect(screen.queryByText(/10,000\.00/)).not.toBeInTheDocument();
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
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
    expect(screen.getByLabelText('Acquisition date row').textContent).toContain('9');
  });

  it('opens edit dialog when pencil icon clicked (handleEditOpen)', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Edit snapshot')[0]);
    expect(screen.getByText('Edit Snapshot')).toBeInTheDocument();
    expect((screen.getByLabelText('Value (EUR)') as HTMLInputElement).value).toBe('10000');
  });

  it('calls mutateAsync when edit dialog Save clicked (handleEditSave)', async () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Edit snapshot')[0]);
    fireEvent.change(screen.getByLabelText('Value (EUR)'), { target: { value: '12000' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        assetId: 'a1',
        data: expect.objectContaining({ value: '12000' }),
      }));
    });
  });

  it('opens delete dialog when trash icon clicked', () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Delete snapshot')[0]);
    expect(screen.getByText('Delete Snapshot')).toBeInTheDocument();
  });

  it('calls deleteSnapshot mutateAsync when delete confirmed', async () => {
    render(<AssetSnapshotsList assetId="a1" snapshots={snapshots} onAddSnapshot={vi.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Delete snapshot')[0]);
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ assetId: 'a1', snapshotId: 's1' });
    });
  });

  it('defaults to showing 10 rows per page', () => {
    const manySnapshots = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i}`,
      assetId: 'a1',
      value: '1000',
      observedAt: new Date(2024, 0, i + 1).toISOString(),
      createdAt: new Date(2024, 0, i + 1).toISOString(),
    }));
    render(<AssetSnapshotsList assetId="a1" snapshots={manySnapshots} onAddSnapshot={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    // 1 header + 10 data rows
    expect(rows).toHaveLength(11);
  });

  it('shows all rows when "All" page size selected', () => {
    const manySnapshots = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i}`,
      assetId: 'a1',
      value: '1000',
      observedAt: new Date(2024, 0, i + 1).toISOString(),
      createdAt: new Date(2024, 0, i + 1).toISOString(),
    }));
    render(<AssetSnapshotsList assetId="a1" snapshots={manySnapshots} onAddSnapshot={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Snapshots per page'), { target: { value: 'all' } });
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(16); // 1 header + 15
  });
});
