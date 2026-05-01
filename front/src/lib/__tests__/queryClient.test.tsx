import { render, screen } from '@testing-library/react';
import { queryClient, QueryProvider } from '../queryClient';

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryCache).toBe('function');
  });
});

describe('QueryProvider', () => {
  it('renders children', () => {
    render(
      <QueryProvider>
        <span>child content</span>
      </QueryProvider>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
