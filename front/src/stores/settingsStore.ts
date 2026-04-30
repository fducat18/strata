/**
 * Settings store — user-configurable locale + currency, persisted to localStorage.
 *
 * Add to this store: locale, currency, number-format prefs, or any other
 * cross-cutting user preference that should survive reloads.
 * Do NOT add: theme (themeStore) or ephemeral UI state (uiStore).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  locale: string;
  currency: string;
  setLocale: (locale: string) => void;
  setCurrency: (currency: string) => void;
}

const STORAGE_KEY = 'strata.settings';

function defaultLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  return navigator.language || 'en-US';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: defaultLocale(),
      currency: 'EUR',
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: STORAGE_KEY }
  )
);

export const useLocale = (): string => useSettingsStore((s) => s.locale);
export const useCurrency = (): string => useSettingsStore((s) => s.currency);
