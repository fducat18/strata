/**
 * Hook: export data as a JSON file.
 *
 * Tries the dedicated backend `/admin/backup` endpoint first; if it 404s
 * (endpoint not yet deployed), falls back to assembling a JSON bundle from
 * the existing per-resource endpoints. Either way, downloads the result.
 */
import { useState, useEffect, useRef } from 'react';
import {
  backupApi,
  assetApi,
  categoryApi,
  tagApi,
  assetTypeApi,
  type ApiError,
  type BackupPayload,
} from '@/lib/api';

export type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function assembleBackupFromResources(): Promise<BackupPayload> {
  const [assets, categories, tags, assetTypes] = await Promise.all([
    assetApi.getAll(),
    categoryApi.getAll(),
    tagApi.getAll(),
    assetTypeApi.getAll(),
  ]);
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: { assets, categories, tags, assetTypes },
  };
}

export function useBackupExport(): {
  status: ExportStatus;
  exportNow: () => Promise<void>;
} {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const exportNow = async (): Promise<void> => {
    setStatus('loading');
    try {
      const payload = await fetchBackupPayload();
      const date = new Date().toISOString().split('T')[0];
      downloadJson(payload, `strata-backup-${date}.json`);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { status, exportNow };
}

async function fetchBackupPayload(): Promise<BackupPayload> {
  try {
    return await backupApi.export();
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr?.status === 404) {
      // TODO: remove fallback once backend `/admin/backup` is deployed.
      return assembleBackupFromResources();
    }
    throw err;
  }
}
