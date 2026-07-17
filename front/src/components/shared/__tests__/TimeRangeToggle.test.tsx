import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeRangeToggle } from '../TimeRangeToggle.js';
import type { TimeRange } from '@/lib/utils/timeRange.js';

describe('TimeRangeToggle', () => {
  it('renders all time range buttons', () => {
    const onRangeChange = vi.fn();
    render(<TimeRangeToggle range="ALL" onRangeChange={onRangeChange} />);
    
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
  });

  it('highlights the active range', () => {
    const onRangeChange = vi.fn();
    render(<TimeRangeToggle range="1M" onRangeChange={onRangeChange} />);
    
    const activeButton = screen.getByRole('button', { name: '1M' });
    expect(activeButton).toHaveClass('bg-primary');
  });

  it('calls onRangeChange when a button is clicked', async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(<TimeRangeToggle range="ALL" onRangeChange={onRangeChange} />);
    
    const button7D = screen.getByRole('button', { name: '7D' });
    await user.click(button7D);
    
    expect(onRangeChange).toHaveBeenCalledWith('7D');
    expect(onRangeChange).toHaveBeenCalledTimes(1);
  });

  it('does not crash when clicking the already-active range', async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(<TimeRangeToggle range="1Y" onRangeChange={onRangeChange} />);
    
    const button1Y = screen.getByRole('button', { name: '1Y' });
    await user.click(button1Y);
    
    expect(onRangeChange).toHaveBeenCalledWith('1Y');
  });
});
