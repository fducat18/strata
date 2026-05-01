export type Theme = 'light' | 'dark' | 'system';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('strata.theme') as Theme) || 'system';
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('strata.theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  if (theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyTheme('system');
    });
  }
}
