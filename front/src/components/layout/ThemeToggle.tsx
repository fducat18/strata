/**
 * Three-state theme cycler (light → dark → system). Uses themeStore.
 */
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, useSetTheme, type Theme } from '@/stores/themeStore';
import { cn } from '@/lib/utils/cn';

const ORDER: Theme[] = ['light', 'dark', 'system'];

function nextTheme(current: Theme): Theme {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
}

function iconFor(theme: Theme) {
  if (theme === 'dark') return Moon;
  if (theme === 'light') return Sun;
  return Monitor;
}

export function ThemeToggle() {
  const theme = useTheme();
  const setTheme = useSetTheme();
  const Icon = iconFor(theme);
  const handleClick = () => setTheme(nextTheme(theme));

  return (
    <button
      onClick={handleClick}
      aria-label={`Theme: ${theme}. Click to cycle.`}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground',
        'hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer'
      )}
      title={`Theme: ${theme}`}
    >
      <Icon className="h-4 w-4" />
      <span className="capitalize">{theme}</span>
    </button>
  );
}
