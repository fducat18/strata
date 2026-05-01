import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useTags: vi.fn(),
  useCreateTag: vi.fn(),
  useDeleteTag: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

import { TagsPage } from '../TagsPage';
import { useTags, useCreateTag, useDeleteTag } from '@/lib/hooks';

const mockUseTags = vi.mocked(useTags);
const mockUseCreateTag = vi.mocked(useCreateTag);
const mockUseDeleteTag = vi.mocked(useDeleteTag);

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

describe('TagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateTag.mockReturnValue(mockMutation as any);
    mockUseDeleteTag.mockReturnValue(mockMutation as any);
  });

  it('shows loading when fetching', () => {
    mockUseTags.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as any);
    render(<TagsPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockUseTags.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() } as any);
    render(<TagsPage />);
    expect(screen.getByText('Could not load tags')).toBeInTheDocument();
  });

  it('shows empty state when no tags', () => {
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() } as any);
    render(<TagsPage />);
    expect(screen.getByText('No tags yet')).toBeInTheDocument();
  });

  it('renders tags', () => {
    const tags = [
      { id: 't1', name: 'growth' },
      { id: 't2', name: 'dividend' },
    ];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    render(<TagsPage />);
    expect(screen.getByText('growth')).toBeInTheDocument();
    expect(screen.getByText('dividend')).toBeInTheDocument();
  });

  it('opens create dialog', () => {
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByText('New Tag'));
    expect(screen.getByRole('heading', { name: 'Create Tag' })).toBeInTheDocument();
  });

  it('closes dialog on cancel', () => {
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByText('New Tag'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('heading', { name: 'Create Tag' })).not.toBeInTheDocument();
  });

  it('creates a tag on valid submit', async () => {
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 't1', name: 'growth' });
    render(<TagsPage />);
    fireEvent.click(screen.getByText('New Tag'));

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'growth' } });

    await waitFor(() => {
      const createBtn = screen.getByText('Create');
      expect(createBtn).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith({ name: 'growth' });
    });
  });

  it('deletes a tag when confirmed', async () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TagsPage />);
    const deleteBtn = screen.getByLabelText('Delete tag growth');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith('t1');
    });
  });
});
