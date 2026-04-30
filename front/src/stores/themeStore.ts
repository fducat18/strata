/**
 * Theme store — light/dark/system theme preference, persisted to localStorage.
 *
 * Add to this store: anything purely about visual theme (e.g. accent color).
 * Do NOT add: locale, currency, or other settings — see settingsStore.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'strata.theme';

function applyThemeToDom(theme: Theme): void {
  if (typeof window === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        applyThemeToDom(theme);
        set({ theme });
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDom(state.theme);
      },
    }
  )
);

export const useTheme = (): Theme => useThemeStore((s) => s.theme);
export const useSetTheme = (): ((t: Theme) => void) =>
  useThemeStore((s) => s.setTheme);

export function initThemeFromStorage(): void {
  if (typeof window === 'undefined') return;
  // Triggers persist rehydration + DOM application.
  const initial = useThemeStore.getState().theme;
  applyThemeToDom(initial);
  if (initial === 'system') {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => applyThemeToDom('system'));
  }
}
