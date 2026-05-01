import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTreeNodeView } from '../CategoryTreeNodeView';
import type { CategoryTreeNode } from '@/lib/types/category';

const leafNode: CategoryTreeNode = {
  id: 'c1',
  name: 'Tech',
  parentId: null,
  children: [],
};

const parentNode: CategoryTreeNode = {
  id: 'c0',
  name: 'Equities',
  parentId: null,
  children: [
    { id: 'c1', name: 'Tech', parentId: 'c0', children: [] },
    { id: 'c2', name: 'Finance', parentId: 'c0', children: [] },
  ],
};

describe('CategoryTreeNodeView', () => {
  it('renders node name', () => {
    render(<CategoryTreeNodeView node={leafNode} onDelete={vi.fn()} level={0} />);
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(<CategoryTreeNodeView node={leafNode} onDelete={vi.fn()} level={0} />);
    expect(screen.getByLabelText('Delete category Tech')).toBeInTheDocument();
  });

  it('calls onDelete with node id when delete clicked', () => {
    const onDelete = vi.fn();
    render(<CategoryTreeNodeView node={leafNode} onDelete={onDelete} level={0} />);
    fireEvent.click(screen.getByLabelText('Delete category Tech'));
    expect(onDelete).toHaveBeenCalledWith('c1');
  });

  it('renders children when parent node', () => {
    render(<CategoryTreeNodeView node={parentNode} onDelete={vi.fn()} level={0} />);
    expect(screen.getByText('Equities')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('shows expand/collapse button for parent nodes', () => {
    render(<CategoryTreeNodeView node={parentNode} onDelete={vi.fn()} level={0} />);
    expect(screen.getByLabelText('Collapse subcategories')).toBeInTheDocument();
  });

  it('does not show expand button for leaf nodes', () => {
    render(<CategoryTreeNodeView node={leafNode} onDelete={vi.fn()} level={0} />);
    expect(screen.queryByLabelText(/subcategories/)).not.toBeInTheDocument();
  });

  it('collapses children when collapse button clicked', () => {
    render(<CategoryTreeNodeView node={parentNode} onDelete={vi.fn()} level={0} />);
    fireEvent.click(screen.getByLabelText('Collapse subcategories'));
    expect(screen.queryByText('Tech')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
  });

  it('expands children again when expand button clicked', () => {
    render(<CategoryTreeNodeView node={parentNode} onDelete={vi.fn()} level={0} />);
    fireEvent.click(screen.getByLabelText('Collapse subcategories'));
    fireEvent.click(screen.getByLabelText('Expand subcategories'));
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('applies correct padding based on level', () => {
    render(<CategoryTreeNodeView node={leafNode} onDelete={vi.fn()} level={2} />);
    const row = screen.getByText('Tech').closest('div[style]');
    expect(row).toHaveStyle('padding-left: 56px');
  });
});
