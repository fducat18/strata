import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { backupApi } from '../backup';
import { api } from '../client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

describe('backupApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('export calls GET /admin/backup', async () => {
    const payload = { version: '1.0', data: {} };
    mockGet.mockResolvedValue({ data: payload });
    const result = await backupApi.export();
    expect(mockGet).toHaveBeenCalledWith('/admin/backup');
    expect(result).toEqual(payload);
  });

  it('restore calls POST /admin/restore', async () => {
    const payload = { version: '1.0', data: {} };
    mockPost.mockResolvedValue({ data: { ok: true } });
    const result = await backupApi.restore(payload);
    expect(mockPost).toHaveBeenCalledWith('/admin/restore', payload);
    expect(result).toEqual({ ok: true });
  });
});
