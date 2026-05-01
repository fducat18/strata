import { ThemeSection } from './ThemeSection';
import { LocaleSection } from './LocaleSection';
import { BackupSection } from './BackupSection';
import { AboutSection } from './AboutSection';

export function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and data.</p>
      </div>
      <ThemeSection />
      <LocaleSection />
      <BackupSection />
      <AboutSection />
    </div>
  );
}
