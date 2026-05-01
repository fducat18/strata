import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

vi.mock('@/lib/theme', () => ({
  getStoredTheme: vi.fn(() => 'system'),
  setTheme: vi.fn(),
  applyTheme: vi.fn(),
}));

import { getStoredTheme, setTheme } from '@/lib/theme';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoredTheme).mockReturnValue('system');
  });

  it('renders a theme button', () => {
    render(<Header />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows current theme text after effect', () => {
    render(<Header />);
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('cycles theme light → dark → system', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('cycles from light to dark', () => {
    vi.mocked(getStoredTheme).mockReturnValue('light');
    render(<Header />);
    fireEvent.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system', () => {
    vi.mocked(getStoredTheme).mockReturnValue('dark');
    render(<Header />);
    fireEvent.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('system');
  });
});
