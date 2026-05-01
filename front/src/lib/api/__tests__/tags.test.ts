import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { tagApi } from '../tags';
import { api } from '../client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockDelete = vi.mocked(api.delete);

describe('tagApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /tags', async () => {
    const tags = [{ id: 't1', name: 'growth' }];
    mockGet.mockResolvedValue({ data: tags });
    const result = await tagApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/tags');
    expect(result).toEqual(tags);
  });

  it('getById calls GET /tags/:id', async () => {
    const tag = { id: 't1', name: 'growth' };
    mockGet.mockResolvedValue({ data: tag });
    const result = await tagApi.getById('t1');
    expect(mockGet).toHaveBeenCalledWith('/tags/t1');
    expect(result).toEqual(tag);
  });

  it('create calls POST /tags', async () => {
    const tag = { id: 't1', name: 'growth' };
    mockPost.mockResolvedValue({ data: tag });
    const result = await tagApi.create({ name: 'growth' });
    expect(mockPost).toHaveBeenCalledWith('/tags', { name: 'growth' });
    expect(result).toEqual(tag);
  });

  it('delete calls DELETE /tags/:id', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await tagApi.delete('t1');
    expect(mockDelete).toHaveBeenCalledWith('/tags/t1');
  });
});
