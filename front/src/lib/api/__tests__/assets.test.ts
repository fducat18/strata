import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { assetApi } from '../assets';
import { api } from '../client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

describe('assetApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /assets without params', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await assetApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/assets');
  });

  it('getById calls GET /assets/:id', async () => {
    const asset = { id: 'a1', name: 'My Stock' };
    mockGet.mockResolvedValue({ data: asset });
    const result = await assetApi.getById('a1');
    expect(mockGet).toHaveBeenCalledWith('/assets/a1');
    expect(result).toEqual(asset);
  });

  it('create calls POST /assets', async () => {
    const asset = { id: 'a1', name: 'New Asset' };
    mockPost.mockResolvedValue({ data: asset });
    const req = { name: 'New Asset', assetTypeId: 'at1' };
    const result = await assetApi.create(req);
    expect(mockPost).toHaveBeenCalledWith('/assets', req);
    expect(result).toEqual(asset);
  });

  it('update calls PUT /assets/:id', async () => {
    const asset = { id: 'a1', name: 'Updated' };
    mockPut.mockResolvedValue({ data: asset });
    const result = await assetApi.update('a1', { name: 'Updated' });
    expect(mockPut).toHaveBeenCalledWith('/assets/a1', { name: 'Updated' });
    expect(result).toEqual(asset);
  });

  it('delete calls DELETE /assets/:id', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await assetApi.delete('a1');
    expect(mockDelete).toHaveBeenCalledWith('/assets/a1');
  });

  it('dispose calls PUT /assets/:id/dispose', async () => {
    const asset = { id: 'a1', disposed: true };
    mockPut.mockResolvedValue({ data: asset });
    const result = await assetApi.dispose('a1');
    expect(mockPut).toHaveBeenCalledWith('/assets/a1/dispose');
    expect(result).toEqual(asset);
  });

  it('getSnapshots calls GET /assets/:id/snapshots', async () => {
    const snapshots = [{ id: 's1', assetId: 'a1', value: '500' }];
    mockGet.mockResolvedValue({ data: snapshots });
    const result = await assetApi.getSnapshots('a1');
    expect(mockGet).toHaveBeenCalledWith('/assets/a1/snapshots');
    expect(result).toEqual(snapshots);
  });

  it('createSnapshot calls POST /assets/:id/snapshots', async () => {
    const snapshot = { id: 's1', assetId: 'a1', value: '500' };
    mockPost.mockResolvedValue({ data: snapshot });
    const req = { value: '500', observedAt: '2024-01-01T00:00:00Z' };
    const result = await assetApi.createSnapshot('a1', req);
    expect(mockPost).toHaveBeenCalledWith('/assets/a1/snapshots', req);
    expect(result).toEqual(snapshot);
  });

  it('addTag calls POST /assets/:id/tags/:tagId', async () => {
    mockPost.mockResolvedValue({ data: undefined });
    await assetApi.addTag('a1', 't1');
    expect(mockPost).toHaveBeenCalledWith('/assets/a1/tags/t1');
  });

  it('removeTag calls DELETE /assets/:id/tags/:tagId', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await assetApi.removeTag('a1', 't1');
    expect(mockDelete).toHaveBeenCalledWith('/assets/a1/tags/t1');
  });

  it('addCategory calls POST /assets/:id/categories/:categoryId', async () => {
    mockPost.mockResolvedValue({ data: undefined });
    await assetApi.addCategory('a1', 'c1');
    expect(mockPost).toHaveBeenCalledWith('/assets/a1/categories/c1');
  });

  it('removeCategory calls DELETE /assets/:id/categories/:categoryId', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await assetApi.removeCategory('a1', 'c1');
    expect(mockDelete).toHaveBeenCalledWith('/assets/a1/categories/c1');
  });
});
