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
  const root = document.documentElement;
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
  root.dataset.theme = theme;
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.backgroundColor = isDark ? '#0f172a' : '#ffffff';
  root.style.color = isDark ? '#f8fafc' : '#0f172a';
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
