/**
 * Backup/restore API — calls /admin/backup and /admin/restore.
 *
 * The backend admin endpoints are being built in parallel; if they are not
 * yet present the call will reject with a normalized 404 ApiError. UI should
 * tolerate that and surface a friendly message.
 */
import { api } from './client';

export interface BackupPayload {
  version: string;
  exportedAt?: string;
  data: Record<string, unknown>;
}

export const backupApi = {
  export: () => api.get<BackupPayload>('/admin/backup').then((r) => r.data),
  restore: (payload: BackupPayload) =>
    api.post('/admin/restore', payload).then((r) => r.data),
};
