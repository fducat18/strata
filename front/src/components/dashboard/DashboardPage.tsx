import { useAssets, useCurrentPortfolioValue } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent, Loading, Button } from '@/components/ui';
import { Package, TrendingUp, AlertCircle } from 'lucide-react';
import { NetWorthChart } from './NetWorthChart';
import { AllocationChart } from './AllocationChart';
import { formatMoney, toDecimal } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';

export function DashboardPage() {
  const { data: assets, isLoading: loadingAssets, isError: errorAssets, refetch: refetchAssets } = useAssets();
  const { data: currentValue, isLoading: loadingValue, isError: errorValue, refetch: refetchValue } = useCurrentPortfolioValue();
  const locale = useLocale();
  const currency = useCurrency();

  if (loadingAssets || loadingValue) return <Loading />;

  if (errorAssets || errorValue) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
        <Button variant="outline" onClick={() => { refetchAssets(); refetchValue(); }}>
          Retry
        </Button>
      </div>
    );
  }

  const activeAssets = assets?.filter(a => !a.disposed) || [];
  const totalAssets = activeAssets.length;

  const allocationByType = activeAssets.reduce((acc, asset) => {
    const type = asset.assetType?.code || 'OTHER';
    const label = asset.assetType?.label || 'Other';
    const assetValue = toDecimal(asset.currentValue)?.toNumber() ?? 0;
    if (!acc[type]) acc[type] = { code: type, label, value: 0 };
    acc[type].value += assetValue;
    return acc;
  }, {} as Record<string, { code: string; label: string; value: number }>);

  const allocationData = Object.values(allocationByType)
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

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
            <div className="text-2xl font-bold">{allocationData.length || Object.keys(allocationByType).length}</div>
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
