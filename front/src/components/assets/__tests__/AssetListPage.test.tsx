import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/hooks', () => ({
  useAssets: vi.fn(),
  useAssetTypes: vi.fn(),
  useCategories: vi.fn(),
  useTags: vi.fn(),
  useCreateAsset: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

import { AssetListPage } from '../AssetListPage';
import {
  useAssets,
  useAssetTypes,
  useCategories,
  useTags,
  useCreateAsset,
} from '@/lib/hooks';

const mockUseAssets = vi.mocked(useAssets);
const mockUseAssetTypes = vi.mocked(useAssetTypes);
const mockUseCategories = vi.mocked(useCategories);
const mockUseTags = vi.mocked(useTags);
const mockUseCreateAsset = vi.mocked(useCreateAsset);

const mockAssets = [
  {
    id: 'a1',
    name: 'Apple Inc',
    disposed: false,
    assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' },
    categories: [],
    tags: [],
    quantity: '10',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'a2',
    name: 'Old Stock',
    disposed: true,
    assetType: { id: 'at1', code: 'STOCKS', label: 'Stocks' },
    categories: [],
    tags: [],
    quantity: null,
    createdAt: '',
    updatedAt: '',
  },
];

const mockMutation = { mutateAsync: vi.fn(), isPending: false };

describe('AssetListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAssetTypes.mockReturnValue({
      data: [{ id: 'at1', code: 'STOCKS', label: 'Stocks' }],
    } as any);
    mockUseCategories.mockReturnValue({ data: [] } as any);
    mockUseTags.mockReturnValue({ data: [] } as any);
    mockUseCreateAsset.mockReturnValue(mockMutation as any);
  });

  it('shows loading state', () => {
    mockUseAssets.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    expect(screen.getByText('Could not load assets')).toBeInTheDocument();
  });

  it('shows retry button on error', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders asset list', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockAssets,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
  });

  it('filters out disposed assets by default', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockAssets,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    expect(screen.queryByText('Old Stock')).not.toBeInTheDocument();
  });

  it('shows disposed assets when checkbox enabled', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockAssets,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(screen.getByText('Old Stock')).toBeInTheDocument();
  });

  it('filters by search term', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockAssets,
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    const searchInput = screen.getByLabelText('Search assets');
    fireEvent.change(searchInput, { target: { value: 'apple' } });
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(screen.queryByText('Old Stock')).not.toBeInTheDocument();
  });

  it('opens create dialog', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    fireEvent.click(screen.getByText('New Asset'));
    expect(screen.getByRole('heading', { name: 'Create Asset' })).toBeInTheDocument();
  });

  it('closes create dialog on cancel', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    fireEvent.click(screen.getByText('New Asset'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('heading', { name: 'Create Asset' })).not.toBeInTheDocument();
  });

  it('shows empty state when no active assets', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    expect(screen.getByText('No assets found')).toBeInTheDocument();
  });

  it('creates asset on valid form submit', async () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 'a3', name: 'New Asset' });
    render(<AssetListPage />);
    fireEvent.click(screen.getByText('New Asset'));

    fireEvent.change(screen.getByPlaceholderText('e.g. Bitcoin'), {
      target: { value: 'My Asset' },
    });

    const typeSelect = screen.getByLabelText('Asset Type');
    fireEvent.change(typeSelect, { target: { value: 'at1' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith({
        name: 'My Asset',
        assetTypeId: 'at1',
        quantity: undefined,
      });
    });
  });

  it('Create button is disabled when name is empty', () => {
    mockUseAssets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);
    render(<AssetListPage />);
    fireEvent.click(screen.getByText('New Asset'));
    expect(screen.getByText('Create')).toBeDisabled();
  });
});
