import { QueryProvider } from '@/lib/queryClient';
import { TagsPage as Inner } from './TagsPage';
export function TagsPage() {
  return <QueryProvider><Inner /></QueryProvider>;
}
