import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useCategories: vi.fn(),
  useCreateCategory: vi.fn(),
  useUpdateCategory: vi.fn(),
  useDeleteCategory: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

import { CategoriesPage } from '../CategoriesPage';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/hooks';

const mockUseCategories = vi.mocked(useCategories);
const mockUseCreateCategory = vi.mocked(useCreateCategory);
const mockUseUpdateCategory = vi.mocked(useUpdateCategory);
const mockUseDeleteCategory = vi.mocked(useDeleteCategory);

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockCategories = [
  { id: 'c1', name: 'Equities', parentId: null },
  { id: 'c2', name: 'US Stocks', parentId: 'c1' },
];

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateCategory.mockReturnValue(mockMutation as any);
    mockUseUpdateCategory.mockReturnValue(mockMutation as any);
    mockUseDeleteCategory.mockReturnValue(mockMutation as any);
  });

  it('shows loading when fetching', () => {
    mockUseCategories.mockReturnValue({ isLoading: true, data: undefined, isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when categories fail to load', () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: undefined, isError: true, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    expect(screen.getByText('Failed to load categories.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows empty state when no categories', () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: [], isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    expect(screen.getByText('No categories yet')).toBeInTheDocument();
  });

  it('renders category tree', () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: mockCategories, isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    expect(screen.getByText('Equities')).toBeInTheDocument();
    expect(screen.getByText('US Stocks')).toBeInTheDocument();
  });

  it('opens create dialog', () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: [], isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    fireEvent.click(screen.getByText('New Category'));
    expect(screen.getByRole('heading', { name: 'Create Category' })).toBeInTheDocument();
  });

  it('closes dialog on cancel', () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: [], isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    fireEvent.click(screen.getByText('New Category'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('heading', { name: 'Create Category' })).not.toBeInTheDocument();
  });

  it('validates required name', async () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: [], isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);
    fireEvent.click(screen.getByText('New Category'));
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('creates category on valid submit', async () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: mockCategories, isError: false, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 'c3', name: 'Bonds', parentId: null });
    render(<CategoriesPage />);
    fireEvent.click(screen.getByText('New Category'));

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Bonds' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith({ name: 'Bonds', parentId: undefined });
    });
  });

  it('deletes a category when confirmed', async () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: mockCategories, isError: false, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CategoriesPage />);
    const deleteBtns = screen.getAllByLabelText(/Delete category/);
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalled();
    });
  });

  it('collapses/expands tree node', () => {
    mockUseCategories.mockReturnValue({ isLoading: false, data: mockCategories, isError: false, refetch: vi.fn() } as any);
    render(<CategoriesPage />);

    const collapseBtn = screen.getByLabelText('Collapse subcategories');
    fireEvent.click(collapseBtn);
    expect(screen.getByLabelText('Expand subcategories')).toBeInTheDocument();
  });
});
