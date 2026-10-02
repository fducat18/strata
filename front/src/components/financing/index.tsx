import { QueryProvider } from '@/lib/queryClient';
import { FinancingScenariosPage as Page } from './FinancingScenariosPage';

export function FinancingScenariosPage() {
  return <QueryProvider><Page /></QueryProvider>;
}
