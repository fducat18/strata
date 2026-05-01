import { render, screen } from '@testing-library/react';
import { AboutSection } from '../AboutSection';

describe('AboutSection', () => {
  it('renders the About Strata card', () => {
    render(<AboutSection />);
    expect(screen.getByText('About Strata')).toBeInTheDocument();
  });

  it('renders version information', () => {
    render(<AboutSection />);
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
  });

  it('renders Backend and Frontend rows', () => {
    render(<AboutSection />);
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('renders documentation link', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /Open Documentation/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
  });
});
