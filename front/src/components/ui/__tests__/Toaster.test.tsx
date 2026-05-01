import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Toaster } from '../Toaster';
import { useUIStore } from '@/stores/uiStore';

describe('Toaster', () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [], openDialogs: {}, selectedIds: {} });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when toasts is empty', () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a success toast', () => {
    useUIStore.setState({
      toasts: [{ id: 't1', message: 'Saved!', variant: 'success' }],
    });
    render(<Toaster />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('renders an error toast', () => {
    useUIStore.setState({
      toasts: [{ id: 't2', message: 'Something failed', variant: 'error' }],
    });
    render(<Toaster />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('renders an info toast', () => {
    useUIStore.setState({
      toasts: [{ id: 't3', message: 'FYI', variant: 'info' }],
    });
    render(<Toaster />);
    expect(screen.getByText('FYI')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    useUIStore.setState({
      toasts: [
        { id: 't1', message: 'First', variant: 'success' },
        { id: 't2', message: 'Second', variant: 'error' },
      ],
    });
    render(<Toaster />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('dismisses toast when X button is clicked', () => {
    useUIStore.setState({
      toasts: [{ id: 't1', message: 'Dismiss me', variant: 'info' }],
    });
    render(<Toaster />);
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('auto-dismisses toast after 4 seconds', () => {
    useUIStore.setState({
      toasts: [{ id: 't1', message: 'Auto-dismiss', variant: 'success' }],
    });
    render(<Toaster />);
    expect(useUIStore.getState().toasts).toHaveLength(1);
    act(() => vi.advanceTimersByTime(4000));
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('does not auto-dismiss before 4 seconds', () => {
    useUIStore.setState({
      toasts: [{ id: 't1', message: 'Still here', variant: 'success' }],
    });
    render(<Toaster />);
    act(() => vi.advanceTimersByTime(3000));
    expect(useUIStore.getState().toasts).toHaveLength(1);
  });

  it('renders the notifications container', () => {
    useUIStore.setState({
      toasts: [{ id: 't1', message: 'Hi', variant: 'info' }],
    });
    render(<Toaster />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });
});
