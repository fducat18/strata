import { QueryProvider } from '@/lib/queryClient';
import { SettingsPage as Inner } from './SettingsPage';
export function SettingsPage() {
  return <QueryProvider><Inner /></QueryProvider>;
}
