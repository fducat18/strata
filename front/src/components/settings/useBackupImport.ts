/**
 * Hook: parse and import a backup JSON file via /admin/restore.
 *
 * Stores parse state in `backupStore` so the confirmation dialog can render
 * counts before the user commits.
 */
import { useRef } from 'react';
import { backupApi, type ApiError } from '@/lib/api';
import { useBackupStore, type ParsedBackup } from '@/stores/backupStore';

function isParsedBackup(value: unknown): value is ParsedBackup {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.version === 'string' && !!v.data && typeof v.data === 'object';
}

export function useBackupImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const store = useBackupStore();

  const openPicker = () => fileInputRef.current?.click();

  const onFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    store.startParse();
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isParsedBackup(parsed)) {
        store.setError('Invalid backup format: missing version or data.');
        return;
      }
      store.setParsed(parsed);
    } catch {
      store.setError('Could not parse the selected file as JSON.');
    }
  };

  const confirmRestore = async (): Promise<void> => {
    if (!store.parsed) return;
    store.startConfirming();
    try {
      await backupApi.restore(store.parsed);
      store.setDone();
    } catch (err) {
      const apiErr = err as ApiError;
      const msg =
        apiErr?.status === 404
          ? 'Backend restore endpoint not yet available. Please deploy /admin/restore.'
          : apiErr?.message || 'Restore failed.';
      store.setError(msg);
    }
  };

  return { fileInputRef, openPicker, onFileChange, confirmRestore, store };
}
