import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { useThemeStore } from '@/stores/themeStore';

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system' });
  });

  it('renders with current theme label', () => {
    render(<ThemeToggle />);
    expect(screen.getByTitle('Theme: system')).toBeInTheDocument();
  });

  it('shows system text', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('cycles to light on click when system', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('cycles to dark on second click', () => {
    useThemeStore.setState({ theme: 'light' });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('cycles back to system from dark', () => {
    useThemeStore.setState({ theme: 'dark' });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('has correct aria-label', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /Theme: system/i })).toBeInTheDocument();
  });
});
