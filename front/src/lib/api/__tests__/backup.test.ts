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
    const payload = { schemaVersion: '1', data: {} };
    mockGet.mockResolvedValue({ data: payload });
    const result = await backupApi.export();
    expect(mockGet).toHaveBeenCalledWith('/admin/backup');
    expect(result).toEqual(payload);
  });

  it('restore calls POST /admin/restore', async () => {
    const payload = { schemaVersion: '1', data: {} };
    mockPost.mockResolvedValue({ data: { ok: true } });
    const result = await backupApi.restore(payload);
    expect(mockPost).toHaveBeenCalledWith('/admin/restore', payload);
    expect(result).toEqual({ ok: true });
  });

  it('exportDb calls GET /admin/backup/sqlite with blob responseType and triggers download', async () => {
    const fakeBlob = new Blob(['SQLite format 3'], { type: 'application/x-sqlite3' });
    mockGet.mockResolvedValue({ data: fakeBlob });

    // Spy on URL + anchor to capture download trigger
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: clickSpy } as unknown as HTMLElement);

    await backupApi.exportDb();

    expect(mockGet).toHaveBeenCalledWith('/admin/backup/sqlite', { responseType: 'blob' });
    expect(createObjectURLSpy).toHaveBeenCalledWith(fakeBlob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url');
  });
});
