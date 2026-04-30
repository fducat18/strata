import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui';

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-destructive');
  });
});
