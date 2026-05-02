import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useTags: vi.fn(),
  useCreateTag: vi.fn(),
  useUpdateTag: vi.fn(),
  useDeleteTag: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

import { TagsPage } from '../TagsPage';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/lib/hooks';

const mockUseTags = vi.mocked(useTags);
const mockUseCreateTag = vi.mocked(useCreateTag);
const mockUseUpdateTag = vi.mocked(useUpdateTag);
const mockUseDeleteTag = vi.mocked(useDeleteTag);

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

describe('TagsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateTag.mockReturnValue(mockMutation as any);
    mockUseUpdateTag.mockReturnValue(mockMutation as any);
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

  it('does not delete when confirm is cancelled', async () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TagsPage />);
    fireEvent.click(screen.getByLabelText('Delete tag growth'));
    await new Promise((r) => setTimeout(r, 50));
    expect(mockMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('opens inline edit mode when pencil is clicked', () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByLabelText('Edit tag growth'));
    expect(screen.getByLabelText('Edit name for tag growth')).toBeInTheDocument();
  });

  it('saves inline edit when save button is clicked', async () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 't1', name: 'value' });
    render(<TagsPage />);
    fireEvent.click(screen.getByLabelText('Edit tag growth'));

    const editInput = screen.getByLabelText('Edit name for tag growth');
    fireEvent.change(editInput, { target: { value: 'value' } });
    fireEvent.click(screen.getByLabelText('Save tag name'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith({ id: 't1', name: 'value' });
    });
  });

  it('saves inline edit when Enter key is pressed', async () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 't1', name: 'updated' });
    render(<TagsPage />);
    fireEvent.click(screen.getByLabelText('Edit tag growth'));

    const editInput = screen.getByLabelText('Edit name for tag growth');
    fireEvent.change(editInput, { target: { value: 'updated' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith({ id: 't1', name: 'updated' });
    });
  });

  it('cancels inline edit when Escape key is pressed', () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByLabelText('Edit tag growth'));

    const editInput = screen.getByLabelText('Edit name for tag growth');
    fireEvent.keyDown(editInput, { key: 'Escape' });
    expect(screen.queryByLabelText('Edit name for tag growth')).not.toBeInTheDocument();
  });

  it('cancels inline edit when cancel button is clicked', () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: tags, refetch: vi.fn() } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByLabelText('Edit tag growth'));
    fireEvent.click(screen.getByLabelText('Cancel edit'));
    expect(screen.queryByLabelText('Edit name for tag growth')).not.toBeInTheDocument();
  });

  it('shows validation error for empty tag name', async () => {
    mockUseTags.mockReturnValue({ isLoading: false, isError: false, data: [], refetch: vi.fn() } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByText('New Tag'));

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'a' } });
    fireEvent.change(nameInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('calls retry on error state button click', () => {
    const refetch = vi.fn();
    mockUseTags.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch } as any);
    render(<TagsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
