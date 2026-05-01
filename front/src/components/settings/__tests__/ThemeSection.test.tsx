import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSection } from '../ThemeSection';
import { useThemeStore } from '@/stores/themeStore';

describe('ThemeSection', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system' });
  });

  it('renders Appearance heading', () => {
    render(<ThemeSection />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders all three theme buttons', () => {
    render(<ThemeSection />);
    expect(screen.getByLabelText('Use Light theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Use Dark theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Use System theme')).toBeInTheDocument();
  });

  it('marks system as active by default', () => {
    render(<ThemeSection />);
    expect(screen.getByLabelText('Use System theme')).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to dark theme on click', () => {
    render(<ThemeSection />);
    fireEvent.click(screen.getByLabelText('Use Dark theme'));
    expect(screen.getByLabelText('Use Dark theme')).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to light theme on click', () => {
    render(<ThemeSection />);
    fireEvent.click(screen.getByLabelText('Use Light theme'));
    expect(screen.getByLabelText('Use Light theme')).toHaveAttribute('aria-pressed', 'true');
  });
});
