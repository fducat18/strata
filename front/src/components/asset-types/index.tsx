import { QueryProvider } from '@/lib/queryClient';
import { AssetTypesPage as Inner } from './AssetTypesPage';

export function AssetTypesPage() {
  return <QueryProvider><Inner /></QueryProvider>;
}
