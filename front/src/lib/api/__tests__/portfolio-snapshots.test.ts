import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  getPortfolioSnapshots,
  getCurrentPortfolioValue,
  createPortfolioSnapshot,
  deletePortfolioSnapshot,
} from '../portfolio-snapshots';
import { api } from '../client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockDelete = vi.mocked(api.delete);

const mockSnapshot = {
  id: 'ps1',
  value: '10000.00',
  currency: 'EUR',
  notes: null,
  observedAt: '2025-01-01T00:00:00.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('portfolio-snapshots API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getPortfolioSnapshots calls GET /portfolio-snapshots', async () => {
    mockGet.mockResolvedValue({ data: [mockSnapshot] });
    const result = await getPortfolioSnapshots();
    expect(mockGet).toHaveBeenCalledWith('/portfolio-snapshots');
    expect(result).toEqual([mockSnapshot]);
  });

  it('getCurrentPortfolioValue calls GET /portfolio-snapshots/current-value', async () => {
    const mockValue = { value: '50000.00', currency: 'EUR' };
    mockGet.mockResolvedValue({ data: mockValue });
    const result = await getCurrentPortfolioValue();
    expect(mockGet).toHaveBeenCalledWith('/portfolio-snapshots/current-value');
    expect(result).toEqual(mockValue);
  });

  it('createPortfolioSnapshot calls POST /portfolio-snapshots with empty body when no dto', async () => {
    mockPost.mockResolvedValue({ data: mockSnapshot });
    const result = await createPortfolioSnapshot();
    expect(mockPost).toHaveBeenCalledWith('/portfolio-snapshots', {});
    expect(result).toEqual(mockSnapshot);
  });

  it('createPortfolioSnapshot passes dto to POST /portfolio-snapshots', async () => {
    mockPost.mockResolvedValue({ data: mockSnapshot });
    const dto = { value: '10000.00', currency: 'EUR', notes: 'Manual' };
    const result = await createPortfolioSnapshot(dto);
    expect(mockPost).toHaveBeenCalledWith('/portfolio-snapshots', dto);
    expect(result).toEqual(mockSnapshot);
  });

  it('deletePortfolioSnapshot calls DELETE /portfolio-snapshots/:id', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await deletePortfolioSnapshot('ps1');
    expect(mockDelete).toHaveBeenCalledWith('/portfolio-snapshots/ps1');
  });
});
