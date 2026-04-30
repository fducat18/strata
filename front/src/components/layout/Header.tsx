import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function Header() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
  }, []);

  const cycleTheme = () => {
    const order: Theme[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(currentTheme) + 1) % order.length];
    setTheme(next);
    setCurrentTheme(next);
  };

  const ThemeIcon = currentTheme === 'dark' ? Moon : currentTheme === 'light' ? Sun : Monitor;

  return (
    <header className="flex h-14 items-center justify-end border-b border-border bg-background px-6">
      <button
        onClick={cycleTheme}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground',
          'hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer'
        )}
        title={`Theme: ${currentTheme}`}
      >
        <ThemeIcon className="h-4 w-4" />
        <span className="capitalize">{currentTheme}</span>
      </button>
    </header>
  );
}
