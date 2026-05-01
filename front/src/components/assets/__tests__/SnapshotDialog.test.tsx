import { render, screen, fireEvent } from '@testing-library/react';
import { SnapshotDialog } from '../SnapshotDialog';

describe('SnapshotDialog', () => {
  it('does not render content when closed', () => {
    render(<SnapshotDialog open={false} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByText('Record Snapshot')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Record Snapshot')).toBeInTheDocument();
  });

  it('Save button is disabled when value is empty', () => {
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('Save button is enabled when value is entered', () => {
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Current Value'), { target: { value: '25000' } });
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('calls onSave with value when Save clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Current Value'), { target: { value: '25000' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('25000');
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<SnapshotDialog open={true} pending={false} onClose={onClose} onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows Saving... when pending', () => {
    render(<SnapshotDialog open={true} pending={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('Save button is disabled when pending', () => {
    render(<SnapshotDialog open={true} pending={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Saving...')).toBeDisabled();
  });
});
