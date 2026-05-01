import { render } from '@testing-library/react';
import { Loading } from '../loading';

describe('Loading', () => {
  it('renders a spinner', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('uses md size by default', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('applies sm size', () => {
    const { container } = render(<Loading size="sm" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('applies lg size', () => {
    const { container } = render(<Loading size="lg" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<Loading className="custom-wrapper" />);
    expect(container.firstChild).toHaveClass('custom-wrapper');
  });
});
