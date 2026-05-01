import { render, screen } from '@testing-library/react';
import { AppShell } from '../AppShell';

vi.mock('../Sidebar', () => ({
  Sidebar: ({ currentPath }: { currentPath: string }) => (
    <div data-testid="sidebar" data-path={currentPath} />
  ),
}));

vi.mock('../Header', () => ({
  Header: () => <div data-testid="header" />,
}));

describe('AppShell', () => {
  it('renders sidebar and header', () => {
    render(
      <AppShell currentPath="/">
        <p>content</p>
      </AppShell>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <AppShell currentPath="/">
        <p>my content</p>
      </AppShell>
    );
    expect(screen.getByText('my content')).toBeInTheDocument();
  });

  it('passes currentPath to Sidebar', () => {
    render(
      <AppShell currentPath="/assets">
        <p>x</p>
      </AppShell>
    );
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-path', '/assets');
  });

  it('renders main content area', () => {
    const { container } = render(
      <AppShell currentPath="/">
        <p>child</p>
      </AppShell>
    );
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
