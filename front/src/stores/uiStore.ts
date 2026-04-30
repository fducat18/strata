/**
 * UI store — ephemeral, non-persisted UI state shared across components.
 *
 * Use for: open dialog ids, currently selected entity ids, transient toasts.
 * Do NOT use for: server data (React Query owns that), persisted prefs (settings/theme).
 */
import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
}

interface UIState {
  openDialogs: Record<string, boolean>;
  selectedIds: Record<string, string | null>;
  toasts: Toast[];

  openDialog: (key: string) => void;
  closeDialog: (key: string) => void;
  isDialogOpen: (key: string) => boolean;

  setSelectedId: (entity: string, id: string | null) => void;
  getSelectedId: (entity: string) => string | null;

  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  openDialogs: {},
  selectedIds: {},
  toasts: [],

  openDialog: (key) =>
    set((s) => ({ openDialogs: { ...s.openDialogs, [key]: true } })),
  closeDialog: (key) =>
    set((s) => ({ openDialogs: { ...s.openDialogs, [key]: false } })),
  isDialogOpen: (key) => !!get().openDialogs[key],

  setSelectedId: (entity, id) =>
    set((s) => ({ selectedIds: { ...s.selectedIds, [entity]: id } })),
  getSelectedId: (entity) => get().selectedIds[entity] ?? null,

  pushToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
