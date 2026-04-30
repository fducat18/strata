/**
 * Backup store — state for the import/restore dialog flow.
 *
 * Tracks the parsed payload, validation errors, and confirmation step.
 * Reset on close.
 */
import { create } from 'zustand';

export interface BackupCounts {
  portfolios: number;
  assets: number;
  categories: number;
  tags: number;
}

export interface ParsedBackup {
  version: string;
  exportedAt?: string;
  data: {
    portfolios?: unknown[];
    assets?: unknown[];
    categories?: unknown[];
    tags?: unknown[];
    assetTypes?: unknown[];
  };
}

type Step = 'idle' | 'parsing' | 'review' | 'confirming' | 'done' | 'error';

interface BackupState {
  step: Step;
  parsed: ParsedBackup | null;
  counts: BackupCounts | null;
  errors: string[];

  startParse: () => void;
  setParsed: (payload: ParsedBackup) => void;
  setError: (message: string) => void;
  startConfirming: () => void;
  setDone: () => void;
  reset: () => void;
}

function countsOf(p: ParsedBackup): BackupCounts {
  return {
    portfolios: p.data.portfolios?.length ?? 0,
    assets: p.data.assets?.length ?? 0,
    categories: p.data.categories?.length ?? 0,
    tags: p.data.tags?.length ?? 0,
  };
}

export const useBackupStore = create<BackupState>((set) => ({
  step: 'idle',
  parsed: null,
  counts: null,
  errors: [],

  startParse: () => set({ step: 'parsing', errors: [], parsed: null }),
  setParsed: (payload) =>
    set({ step: 'review', parsed: payload, counts: countsOf(payload) }),
  setError: (message) =>
    set((s) => ({ step: 'error', errors: [...s.errors, message] })),
  startConfirming: () => set({ step: 'confirming' }),
  setDone: () => set({ step: 'done' }),
  reset: () => set({ step: 'idle', parsed: null, counts: null, errors: [] }),
}));
