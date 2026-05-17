import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(<Sidebar currentPath="/" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Portfolios')).not.toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Asset Types')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Strata brand when expanded', () => {
    render(<Sidebar currentPath="/" />);
    expect(screen.getByText('Strata')).toBeInTheDocument();
  });

  it('collapses on toggle click', () => {
    render(<Sidebar currentPath="/" />);
    const toggleBtn = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('expands again on second click', () => {
    render(<Sidebar currentPath="/" />);
    const collapseBtn = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(collapseBtn);
    fireEvent.click(screen.getByLabelText('Expand sidebar'));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('marks active link for exact path', () => {
    render(<Sidebar currentPath="/assets" />);
    const assetsLink = screen.getByRole('link', { name: /Assets/i });
    expect(assetsLink).toHaveClass('bg-sidebar-accent');
  });

  it('marks nested active links', () => {
    render(<Sidebar currentPath="/assets/abc-123" />);
    const assetsLink = screen.getByRole('link', { name: /Assets/i });
    expect(assetsLink).toHaveClass('bg-sidebar-accent');
  });

  it('marks active links when currentPath includes desktop /app prefix', () => {
    render(<Sidebar currentPath="/app/assets" />);
    const assetsLink = screen.getByRole('link', { name: /Assets/i });
    expect(assetsLink).toHaveClass('bg-sidebar-accent');
  });

  it('does not mark Dashboard as active on /assets', () => {
    render(<Sidebar currentPath="/assets" />);
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).not.toHaveClass('bg-sidebar-accent');
  });

  it('renders version info when expanded', () => {
    const { container } = render(<Sidebar currentPath="/" />);
    expect(container.querySelector('[title]')).toBeInTheDocument();
  });

  it('shows v abbreviation when collapsed', () => {
    render(<Sidebar currentPath="/" />);
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(screen.getByLabelText('Version')).toBeInTheDocument();
  });
});
