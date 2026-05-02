import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api/portfolio-snapshots', () => ({
  getPortfolioSnapshots: vi.fn(),
  getCurrentPortfolioValue: vi.fn(),
  createPortfolioSnapshot: vi.fn(),
  deletePortfolioSnapshot: vi.fn(),
}));

import {
  usePortfolioSnapshots,
  useCurrentPortfolioValue,
  useCreatePortfolioSnapshot,
  useDeletePortfolioSnapshot,
} from '../portfolio-snapshots';
import {
  getPortfolioSnapshots,
  getCurrentPortfolioValue,
  createPortfolioSnapshot,
  deletePortfolioSnapshot,
} from '@/lib/api/portfolio-snapshots';

const mockGetPortfolioSnapshots = vi.mocked(getPortfolioSnapshots);
const mockGetCurrentPortfolioValue = vi.mocked(getCurrentPortfolioValue);
const mockCreatePortfolioSnapshot = vi.mocked(createPortfolioSnapshot);
const mockDeletePortfolioSnapshot = vi.mocked(deletePortfolioSnapshot);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const mockSnapshot = {
  id: 'ps1',
  value: '10000.00',
  currency: 'EUR',
  notes: null,
  observedAt: '2025-01-01T00:00:00.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('usePortfolioSnapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all portfolio snapshots', async () => {
    mockGetPortfolioSnapshots.mockResolvedValue([mockSnapshot]);
    const { result } = renderHook(() => usePortfolioSnapshots(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockSnapshot]);
    expect(mockGetPortfolioSnapshots).toHaveBeenCalled();
  });
});

describe('useCurrentPortfolioValue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches current portfolio value', async () => {
    const mockValue = { value: '50000.00', currency: 'EUR' };
    mockGetCurrentPortfolioValue.mockResolvedValue(mockValue);
    const { result } = renderHook(() => useCurrentPortfolioValue(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockValue);
    expect(mockGetCurrentPortfolioValue).toHaveBeenCalled();
  });
});

describe('useCreatePortfolioSnapshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a portfolio snapshot without dto', async () => {
    mockCreatePortfolioSnapshot.mockResolvedValue(mockSnapshot);
    mockGetPortfolioSnapshots.mockResolvedValue([]);
    mockGetCurrentPortfolioValue.mockResolvedValue({ value: '0', currency: 'EUR' });
    const { result } = renderHook(() => useCreatePortfolioSnapshot(), { wrapper: createWrapper() });
    await result.current.mutateAsync(undefined);
    expect(mockCreatePortfolioSnapshot).toHaveBeenCalledWith(undefined);
  });

  it('creates a portfolio snapshot with dto', async () => {
    mockCreatePortfolioSnapshot.mockResolvedValue(mockSnapshot);
    mockGetPortfolioSnapshots.mockResolvedValue([]);
    mockGetCurrentPortfolioValue.mockResolvedValue({ value: '0', currency: 'EUR' });
    const { result } = renderHook(() => useCreatePortfolioSnapshot(), { wrapper: createWrapper() });
    const dto = { value: '10000.00', currency: 'EUR', notes: 'Manual snapshot' };
    await result.current.mutateAsync(dto);
    expect(mockCreatePortfolioSnapshot).toHaveBeenCalledWith(dto);
  });
});

describe('useDeletePortfolioSnapshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a portfolio snapshot', async () => {
    mockDeletePortfolioSnapshot.mockResolvedValue(undefined);
    mockGetPortfolioSnapshots.mockResolvedValue([]);
    mockGetCurrentPortfolioValue.mockResolvedValue({ value: '0', currency: 'EUR' });
    const { result } = renderHook(() => useDeletePortfolioSnapshot(), { wrapper: createWrapper() });
    await result.current.mutateAsync('ps1');
    expect(mockDeletePortfolioSnapshot).toHaveBeenCalledWith('ps1');
  });
});
