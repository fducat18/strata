import { Card, CardHeader, CardTitle, CardDescription, CardContent, Select } from '@/components/ui';
import { useSettingsStore } from '@/stores/settingsStore';

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-FR', label: 'Français (FR)' },
  { value: 'de-DE', label: 'Deutsch (DE)' },
  { value: 'es-ES', label: 'Español (ES)' },
  { value: 'it-IT', label: 'Italiano (IT)' },
  { value: 'ja-JP', label: '日本語 (JP)' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
];

export function LocaleSection() {
  const { locale, currency, setLocale, setCurrency } = useSettingsStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Locale & Currency</CardTitle>
        <CardDescription>Used for formatting numbers, dates, and money.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="locale-select" className="text-sm font-medium">Display locale</label>
            <Select
              id="locale-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="mt-1"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="currency-select" className="text-sm font-medium">Default currency</label>
            <Select
              id="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
