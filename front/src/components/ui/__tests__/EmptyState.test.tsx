import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState, Button } from '@/components/ui';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Create your first item." />);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Create your first item.')).toBeInTheDocument();
  });

  it('renders action button', () => {
    render(
      <EmptyState
        title="Empty"
        action={<Button>Create</Button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
