import { render, screen, fireEvent } from '@testing-library/react';
import { AssetTagsCard } from '../AssetTagsCard';
import type { Asset, Tag } from '@/lib/types';

const mockAsset: Asset = {
  id: 'a1',
  name: 'Apple',
  quantity: null,
  disposed: false,
  assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' },
  categories: [],
  tags: [{ id: 't1', name: 'growth' }],
  createdAt: '',
  updatedAt: '',
};

const availableTags: Tag[] = [{ id: 't2', name: 'dividend' }];

describe('AssetTagsCard', () => {
  it('renders assigned tags', () => {
    render(
      <AssetTagsCard
        asset={mockAsset}
        availableTags={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('growth')).toBeInTheDocument();
  });

  it('shows "No tags" when none assigned', () => {
    render(
      <AssetTagsCard
        asset={{ ...mockAsset, tags: [] }}
        availableTags={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('No tags')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn();
    render(
      <AssetTagsCard
        asset={mockAsset}
        availableTags={[]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove tag growth'));
    expect(onRemove).toHaveBeenCalledWith('t1');
  });

  it('shows available tags to add', () => {
    render(
      <AssetTagsCard
        asset={{ ...mockAsset, tags: [] }}
        availableTags={availableTags}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Add tag dividend')).toBeInTheDocument();
  });

  it('calls onAdd when add button clicked', () => {
    const onAdd = vi.fn();
    render(
      <AssetTagsCard
        asset={{ ...mockAsset, tags: [] }}
        availableTags={availableTags}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Add tag dividend'));
    expect(onAdd).toHaveBeenCalledWith('t2');
  });

  it('does not show add buttons when no available tags', () => {
    render(
      <AssetTagsCard
        asset={{ ...mockAsset, tags: [] }}
        availableTags={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/Add tag/)).not.toBeInTheDocument();
  });
});
