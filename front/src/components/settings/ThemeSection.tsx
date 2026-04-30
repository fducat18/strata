import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, useSetTheme, type Theme } from '@/stores/themeStore';

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeSection() {
  const current = useTheme();
  const setTheme = useSetTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose your preferred theme.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => {
            const active = current === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-pressed={active}
                aria-label={`Use ${label} theme`}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                  active
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
