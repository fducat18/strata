import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <DeleteConfirmDialog open={false} pending={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.queryByText('Delete Asset')).not.toBeInTheDocument();
  });

  it('renders confirmation message when open', () => {
    render(
      <DeleteConfirmDialog open={true} pending={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.getByText('Delete Asset')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this asset/)).toBeInTheDocument();
  });

  it('calls onConfirm when Delete button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmDialog open={true} pending={false} onClose={vi.fn()} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button clicked', () => {
    const onClose = vi.fn();
    render(
      <DeleteConfirmDialog open={true} pending={false} onClose={onClose} onConfirm={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Deleting…" and disables buttons when pending', () => {
    render(
      <DeleteConfirmDialog open={true} pending={true} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.getByText('Deleting…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
