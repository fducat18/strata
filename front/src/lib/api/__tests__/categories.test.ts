import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { categoryApi } from '../categories';
import { api } from '../client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockDelete = vi.mocked(api.delete);

describe('categoryApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /categories', async () => {
    const cats = [{ id: 'c1', name: 'Equities', parentId: null }];
    mockGet.mockResolvedValue({ data: cats });
    const result = await categoryApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/categories');
    expect(result).toEqual(cats);
  });

  it('getById calls GET /categories/:id', async () => {
    const cat = { id: 'c1', name: 'Equities', parentId: null };
    mockGet.mockResolvedValue({ data: cat });
    const result = await categoryApi.getById('c1');
    expect(mockGet).toHaveBeenCalledWith('/categories/c1');
    expect(result).toEqual(cat);
  });

  it('create calls POST /categories', async () => {
    const cat = { id: 'c1', name: 'Equities', parentId: null };
    mockPost.mockResolvedValue({ data: cat });
    const result = await categoryApi.create({ name: 'Equities' });
    expect(mockPost).toHaveBeenCalledWith('/categories', { name: 'Equities' });
    expect(result).toEqual(cat);
  });

  it('delete calls DELETE /categories/:id', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await categoryApi.delete('c1');
    expect(mockDelete).toHaveBeenCalledWith('/categories/c1');
  });

  it('getChildren calls GET /categories/:id/children', async () => {
    const children = [{ id: 'c2', name: 'US Stocks', parentId: 'c1' }];
    mockGet.mockResolvedValue({ data: children });
    const result = await categoryApi.getChildren('c1');
    expect(mockGet).toHaveBeenCalledWith('/categories/c1/children');
    expect(result).toEqual(children);
  });
});
