import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { assetTypeApi } from '../assetTypes';
import { api } from '../client';

const mockGet = vi.mocked(api.get);

describe('assetTypeApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /asset-types', async () => {
    const types = [{ id: 'at1', code: 'STOCKS', label: 'Stocks' }];
    mockGet.mockResolvedValue({ data: types });
    const result = await assetTypeApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/asset-types');
    expect(result).toEqual(types);
  });

  it('getById calls GET /asset-types/:id', async () => {
    const type = { id: 'at1', code: 'STOCKS', label: 'Stocks' };
    mockGet.mockResolvedValue({ data: type });
    const result = await assetTypeApi.getById('at1');
    expect(mockGet).toHaveBeenCalledWith('/asset-types/at1');
    expect(result).toEqual(type);
  });
});
