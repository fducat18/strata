import { render, screen, fireEvent } from '@testing-library/react';
import { SnapshotDialog } from '../SnapshotDialog';

const TODAY = new Date().toISOString().slice(0, 10);

describe('SnapshotDialog', () => {
  it('does not render content when closed', () => {
    render(<SnapshotDialog open={false} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByText('Record Snapshot')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Record Snapshot')).toBeInTheDocument();
  });

  it('shows date input defaulting to today', () => {
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={vi.fn()} />);
    const dateInput = screen.getByLabelText('Observed on') as HTMLInputElement;
    expect(dateInput.value).toBe(TODAY);
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

  it('calls onSave with value and observedAt when Save clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Current Value'), { target: { value: '25000' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('25000', TODAY);
  });

  it('calls onSave with custom observedAt when date is changed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SnapshotDialog open={true} pending={false} onClose={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Current Value'), { target: { value: '25000' } });
    fireEvent.change(screen.getByLabelText('Observed on'), { target: { value: '2024-01-01' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('25000', '2024-01-01');
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<SnapshotDialog open={true} pending={false} onClose={onClose} onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('resets value to empty when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<SnapshotDialog open={true} pending={false} onClose={onClose} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Current Value'), { target: { value: '12345' } });
    expect((screen.getByLabelText('Current Value') as HTMLInputElement).value).toBe('12345');
    fireEvent.click(screen.getByText('Cancel'));
    expect((screen.getByLabelText('Current Value') as HTMLInputElement).value).toBe('');
  });

  it('resets date to today when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<SnapshotDialog open={true} pending={false} onClose={onClose} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Observed on'), { target: { value: '2020-06-15' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect((screen.getByLabelText('Observed on') as HTMLInputElement).value).toBe(TODAY);
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
