import { useState, useEffect, useRef } from 'react';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';
import { portfolioApi, assetApi, categoryApi, tagApi, assetTypeApi } from '@/lib/api-client';
import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui';
import { Sun, Moon, Monitor, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
  };

  const handleExport = async () => {
    setExportStatus('loading');
    try {
      const [portfolios, assets, categories, tags, assetTypes] = await Promise.all([
        portfolioApi.getAll(),
        assetApi.getAll(),
        categoryApi.getAll(),
        tagApi.getAll(),
        assetTypeApi.getAll(),
      ]);

      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: { portfolios, assets, categories, tags, assetTypes },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strata-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data || !backup.version) {
        throw new Error('Invalid backup file');
      }
      setImportStatus('success');
      alert(`Backup file validated: ${backup.data.portfolios?.length || 0} portfolios, ${backup.data.assets?.length || 0} assets. Full import requires a backend endpoint.`);
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and data.</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                  currentTheme === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Data Backup</CardTitle>
          <CardDescription>Export or import your financial data as JSON.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleExport} disabled={exportStatus === 'loading'} variant="outline">
              {exportStatus === 'loading' ? (
                'Exporting...'
              ) : exportStatus === 'success' ? (
                <><CheckCircle className="h-4 w-4 text-green-500" /> Exported!</>
              ) : exportStatus === 'error' ? (
                <><AlertCircle className="h-4 w-4 text-destructive" /> Failed</>
              ) : (
                <><Download className="h-4 w-4" /> Export Backup</>
              )}
            </Button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importStatus === 'loading'}
              >
                {importStatus === 'loading' ? (
                  'Importing...'
                ) : importStatus === 'success' ? (
                  <><CheckCircle className="h-4 w-4 text-green-500" /> Validated!</>
                ) : importStatus === 'error' ? (
                  <><AlertCircle className="h-4 w-4 text-destructive" /> Failed</>
                ) : (
                  <><Upload className="h-4 w-4" /> Import Backup</>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Exports all portfolios, assets, categories, and tags to a JSON file that you can use for backups or computer migration.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About Strata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-medium">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Backend</dt>
              <dd className="font-medium">NestJS + Prisma + SQLite</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frontend</dt>
              <dd className="font-medium">Astro + React + Tailwind CSS</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Documentation</dt>
              <dd><a href="https://strata.ducatillon.net/docs/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">strata.ducatillon.net/docs</a></dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
