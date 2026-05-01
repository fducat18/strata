import { QueryProvider } from '@/lib/queryClient';
import { CategoriesPage as Inner } from './CategoriesPage';
export function CategoriesPage() {
  return <QueryProvider><Inner /></QueryProvider>;
}
