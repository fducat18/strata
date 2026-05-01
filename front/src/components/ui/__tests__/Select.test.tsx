import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../select';

describe('Select', () => {
  it('renders a select element', () => {
    render(
      <Select>
        <option value="a">Option A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders options', () => {
    render(
      <Select>
        <option value="eur">EUR</option>
        <option value="usd">USD</option>
      </Select>
    );
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Select className="my-class">
        <option value="a">A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('my-class');
  });

  it('is disabled when disabled prop is set', () => {
    render(
      <Select disabled>
        <option value="a">A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(
      <Select ref={ref}>
        <option value="a">A</option>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('triggers onChange', () => {
    const onChange = vi.fn();
    render(
      <Select onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalled();
  });
});
