import { render, screen, fireEvent } from '@testing-library/react';
import { AssetCategoriesCard } from '../AssetCategoriesCard';
import type { Asset, Category } from '@/lib/types';

const mockAsset: Asset = {
  id: 'a1',
  name: 'Apple',
  quantity: null,
  disposed: false,
  assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
  categories: [{ id: 'c1', name: 'Tech', parentId: null }],
  tags: [],
  createdAt: '',
  updatedAt: '',
};

const availableCategories: Category[] = [
  { id: 'c2', name: 'Equities', parentId: null },
];

describe('AssetCategoriesCard', () => {
  it('renders assigned categories', () => {
    render(
      <AssetCategoriesCard
        asset={mockAsset}
        availableCategories={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('shows "No categories" when none assigned', () => {
    render(
      <AssetCategoriesCard
        asset={{ ...mockAsset, categories: [] }}
        availableCategories={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText('No categories')).toBeInTheDocument();
  });

  it('shows available categories to add', () => {
    render(
      <AssetCategoriesCard
        asset={{ ...mockAsset, categories: [] }}
        availableCategories={availableCategories}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Add category Equities')).toBeInTheDocument();
  });

  it('calls onAdd when category button clicked', () => {
    const onAdd = vi.fn();
    render(
      <AssetCategoriesCard
        asset={{ ...mockAsset, categories: [] }}
        availableCategories={availableCategories}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Add category Equities'));
    expect(onAdd).toHaveBeenCalledWith('c2');
  });

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn();
    render(
      <AssetCategoriesCard
        asset={mockAsset}
        availableCategories={[]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove category Tech'));
    expect(onRemove).toHaveBeenCalledWith('c1');
  });

  it('does not show add buttons when no available categories', () => {
    render(
      <AssetCategoriesCard
        asset={{ ...mockAsset, categories: [] }}
        availableCategories={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/Add category/)).not.toBeInTheDocument();
  });
});
