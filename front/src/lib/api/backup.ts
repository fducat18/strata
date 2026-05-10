/**
 * Backup/restore API — calls /admin/backup and /admin/restore.
 *
 * The backend admin endpoints are being built in parallel; if they are not
 * yet present the call will reject with a normalized 404 ApiError. UI should
 * tolerate that and surface a friendly message.
 */
import { api } from './client';

export interface BackupPayload {
  schemaVersion: string;
  exportedAt?: string;
  data: Record<string, unknown>;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const backupApi = {
  export: () => api.get<BackupPayload>('/admin/backup').then((r) => r.data),
  restore: (payload: BackupPayload) =>
    api.post('/admin/restore', payload).then((r) => r.data),
  exportDb: async (): Promise<void> => {
    const response = await api.get('/admin/backup/sqlite', {
      responseType: 'blob',
    });
    const date = new Date().toISOString().split('T')[0];
    triggerDownload(response.data as Blob, `strata-backup-${date}.db`);
  },
};
