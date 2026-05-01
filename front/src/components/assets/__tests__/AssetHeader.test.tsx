import { render, screen, fireEvent } from '@testing-library/react';
import { AssetHeader } from '../AssetHeader';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Asset } from '@/lib/types';

const mockAsset: Asset = {
  id: 'a1',
  name: 'Apple Inc.',
  quantity: '10',
  disposed: false,
  assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' },
  categories: [],
  tags: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AssetHeader', () => {
  beforeEach(() => {
    useSettingsStore.setState({ locale: 'en-US', currency: 'EUR' });
  });

  it('renders asset name', () => {
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('renders asset type label', () => {
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/Stocks/)).toBeInTheDocument();
  });

  it('shows disposed badge when disposed', () => {
    render(
      <AssetHeader
        asset={{ ...mockAsset, disposed: true }}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Disposed')).toBeInTheDocument();
  });

  it('hides dispose button when already disposed', () => {
    render(
      <AssetHeader
        asset={{ ...mockAsset, disposed: true }}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByLabelText('Mark asset as disposed')).not.toBeInTheDocument();
  });

  it('shows dispose button when not disposed', () => {
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Mark asset as disposed')).toBeInTheDocument();
  });

  it('calls onSnapshot when Snapshot button clicked', () => {
    const onSnapshot = vi.fn();
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={onSnapshot}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Record snapshot'));
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('calls onEdit when Edit button clicked', () => {
    const onEdit = vi.fn();
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={onEdit}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Edit asset'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onDispose when Dispose button clicked', () => {
    const onDispose = vi.fn();
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={onDispose}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Mark asset as disposed'));
    expect(onDispose).toHaveBeenCalled();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByLabelText('Delete asset'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('renders back to assets link', () => {
    render(
      <AssetHeader
        asset={mockAsset}
        onSnapshot={vi.fn()}
        onEdit={vi.fn()}
        onDispose={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Back to assets')).toBeInTheDocument();
  });
});
