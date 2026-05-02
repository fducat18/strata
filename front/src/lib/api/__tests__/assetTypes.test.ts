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
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

describe('assetTypeApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /asset-types', async () => {
    const types = [{ id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' }];
    mockGet.mockResolvedValue({ data: types });
    const result = await assetTypeApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/asset-types');
    expect(result).toEqual(types);
  });

  it('getById calls GET /asset-types/:id', async () => {
    const type = { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' };
    mockGet.mockResolvedValue({ data: type });
    const result = await assetTypeApi.getById('at1');
    expect(mockGet).toHaveBeenCalledWith('/asset-types/at1');
    expect(result).toEqual(type);
  });

  it('create calls POST /asset-types', async () => {
    const newType = { id: 'at3', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' };
    mockPost.mockResolvedValue({ data: newType });
    const result = await assetTypeApi.create({
      code: 'CRYPTO_ETF',
      label: 'Crypto ETF',
      group: 'FINANCIAL',
    });
    expect(mockPost).toHaveBeenCalledWith('/asset-types', {
      code: 'CRYPTO_ETF',
      label: 'Crypto ETF',
      group: 'FINANCIAL',
    });
    expect(result).toEqual(newType);
  });

  it('update calls PUT /asset-types/:id', async () => {
    const updated = { id: 'at1', code: 'STOCKS', label: 'Public Stocks', group: 'FINANCIAL' };
    mockPut.mockResolvedValue({ data: updated });
    const result = await assetTypeApi.update('at1', { label: 'Public Stocks', group: 'FINANCIAL' });
    expect(mockPut).toHaveBeenCalledWith('/asset-types/at1', {
      label: 'Public Stocks',
      group: 'FINANCIAL',
    });
    expect(result).toEqual(updated);
  });

  it('delete calls DELETE /asset-types/:id', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await assetTypeApi.delete('at1');
    expect(mockDelete).toHaveBeenCalledWith('/asset-types/at1');
  });
});
