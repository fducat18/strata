import { QueryProvider } from '@/lib/queryClient';
import { DashboardPage as Inner } from './DashboardPage';
export function DashboardPage() {
  return <QueryProvider><Inner /></QueryProvider>;
}
export { NetWorthChart } from './NetWorthChart';
export { AllocationChart } from './AllocationChart';
