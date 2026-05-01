import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../dialog';

describe('Dialog', () => {
  it('does not render when open is false', () => {
    render(<Dialog open={false} onClose={vi.fn()}><p>content</p></Dialog>);
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders children when open is true', () => {
    render(<Dialog open={true} onClose={vi.fn()}><p>content</p></Dialog>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<Dialog open={true} onClose={onClose}><p>content</p></Dialog>);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<Dialog open={true} onClose={onClose}><p>content</p></Dialog>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not add Escape listener when closed', () => {
    const onClose = vi.fn();
    render(<Dialog open={false} onClose={onClose}><p>content</p></Dialog>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when overlay backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Dialog open={true} onClose={onClose}><p>content</p></Dialog>);
    const overlay = container.querySelector('.fixed') as HTMLElement;
    fireEvent.click(overlay, { target: overlay });
  });

  it('applies custom className to dialog content', () => {
    const { container } = render(
      <Dialog open={true} onClose={vi.fn()} className="custom-class"><p>content</p></Dialog>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('DialogHeader', () => {
  it('renders with children', () => {
    render(<DialogHeader><span>Header content</span></DialogHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<DialogHeader className="my-class"><span>x</span></DialogHeader>);
    expect(container.firstChild).toHaveClass('my-class');
  });
});

describe('DialogTitle', () => {
  it('renders as h2', () => {
    render(<DialogTitle>My Title</DialogTitle>);
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('My Title');
  });
});

describe('DialogFooter', () => {
  it('renders children', () => {
    render(<DialogFooter><button>OK</button></DialogFooter>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
