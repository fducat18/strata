import { useAssets, useCurrentPortfolioValue, useCreatePortfolioSnapshot, usePortfolioSnapshots } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent, Loading, Button } from '@/components/ui';
import { Package, TrendingUp, Camera } from 'lucide-react';
import { NetWorthChart } from './NetWorthChart';
import { AllocationChart } from './AllocationChart';
import { formatMoney } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';

export function DashboardPage() {
  const { data: assets, isLoading: loadingAssets } = useAssets();
  const { data: currentValue, isLoading: loadingValue } = useCurrentPortfolioValue();
  const snapshotMutation = useCreatePortfolioSnapshot();
  const locale = useLocale();
  const currency = useCurrency();

  if (loadingAssets || loadingValue) return <Loading />;

  const activeAssets = assets?.filter(a => !a.disposed) || [];
  const totalAssets = activeAssets.length;

  const allocationByType = activeAssets.reduce((acc, asset) => {
    const type = asset.assetType?.code || 'OTHER';
    const label = asset.assetType?.label || 'Other';
    if (!acc[type]) acc[type] = { code: type, label, count: 0 };
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { code: string; label: string; count: number }>);

  const allocationData = Object.values(allocationByType).sort((a, b) => b.count - a.count);

  const handleTakeSnapshot = async () => {
    try {
      const snapshot = await snapshotMutation.mutateAsync(undefined);
      const formatted = formatMoney(snapshot.value, { currency: snapshot.currency || currency, locale });
      useUIStore.getState().pushToast({ variant: 'success', message: `📸 Snapshot recorded — ${formatted}` });
    } catch (err) {
      const message = (err as any)?.message ?? 'Failed to take snapshot';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const netWorth = currentValue
    ? formatMoney(currentValue.value, { currency: currentValue.currency || currency, locale })
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview at a glance.</p>
        </div>
        <Button onClick={handleTakeSnapshot} disabled={snapshotMutation.isPending}>
          <Camera className="h-4 w-4" /> {snapshotMutation.isPending ? 'Saving…' : 'Take Snapshot'}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netWorth}</div>
          </CardContent>
        </Card>

        <a href="/assets" className="block">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssets}</div>
            </CardContent>
          </Card>
        </a>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asset Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocationData.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth History</CardTitle>
          </CardHeader>
          <CardContent>
            <NetWorthChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationChart data={allocationData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
