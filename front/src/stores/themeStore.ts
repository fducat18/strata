/**
 * Theme store — light/dark/system theme preference, persisted to localStorage.
 *
 * Initialization is synchronous (read localStorage at module load) to avoid
 * race conditions between user clicks and zustand-persist async rehydration.
 */
import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'strata.theme';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'system';
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } } | Theme;
    if (typeof parsed === 'string') return parsed;
    return parsed.state?.theme ?? 'system';
  } catch {
    return 'system';
  }
}

function writeStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore quota errors */
  }
}

function applyThemeToDom(theme: Theme): void {
  if (typeof window === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = theme;
}

const initialTheme = readStoredTheme();
applyThemeToDom(initialTheme);

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    writeStoredTheme(theme);
    applyThemeToDom(theme);
    set({ theme });
  },
}));

export const useTheme = (): Theme => useThemeStore((s) => s.theme);
export const useSetTheme = (): ((t: Theme) => void) =>
  useThemeStore((s) => s.setTheme);