import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../table';

describe('Table components', () => {
  it('renders a complete table', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Bitcoin</TableCell>
            <TableCell>50000</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('50000')).toBeInTheDocument();
  });

  it('renders a table element', () => {
    const { container } = render(<Table><TableBody><TableRow><TableCell>x</TableCell></TableRow></TableBody></Table>);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('applies custom className to Table', () => {
    const { container } = render(
      <Table className="my-table"><TableBody><TableRow><TableCell>x</TableCell></TableRow></TableBody></Table>
    );
    expect(container.querySelector('table')).toHaveClass('my-table');
  });

  it('renders TableHeader as thead', () => {
    const { container } = render(
      <Table>
        <TableHeader><TableRow><TableHead>Col</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell>x</TableCell></TableRow></TableBody>
      </Table>
    );
    expect(container.querySelector('thead')).toBeInTheDocument();
  });

  it('renders TableBody as tbody', () => {
    const { container } = render(
      <Table>
        <TableBody><TableRow><TableCell>x</TableCell></TableRow></TableBody>
      </Table>
    );
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('applies custom className to TableRow', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow className="custom-row"><TableCell>x</TableCell></TableRow>
        </TableBody>
      </Table>
    );
    expect(container.querySelector('tr')).toHaveClass('custom-row');
  });

  it('renders TableHead as th', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow><TableHead className="my-th">Col</TableHead></TableRow>
        </TableHeader>
        <TableBody><TableRow><TableCell>x</TableCell></TableRow></TableBody>
      </Table>
    );
    expect(container.querySelector('th')).toHaveClass('my-th');
  });

  it('renders TableCell as td', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow><TableCell className="my-td">data</TableCell></TableRow>
        </TableBody>
      </Table>
    );
    expect(container.querySelector('td')).toHaveClass('my-td');
  });
});
