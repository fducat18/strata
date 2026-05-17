import { useAssets, useCurrentPortfolioValue } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent, Loading, Button } from '@/components/ui';
import { TrendingUp, AlertCircle, TrendingDown, Package } from 'lucide-react';
import { NetWorthChart } from './NetWorthChart';
import { AllocationChart } from './AllocationChart';
import { formatMoney, toDecimal } from '@/lib/format';
import { appHref } from '@/lib/appPath';
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

  // Split assets vs liabilities
  const nonLiabilityAssets = activeAssets.filter(a => a.assetType?.group !== 'LIABILITIES');
  const liabilityAssets = activeAssets.filter(a => a.assetType?.group === 'LIABILITIES');

  const totalAssetsValue = nonLiabilityAssets.reduce((sum, a) => {
    return sum + (toDecimal(a.currentValue)?.toNumber() ?? 0);
  }, 0);
  const totalLiabilitiesValue = liabilityAssets.reduce((sum, a) => {
    return sum + (toDecimal(a.currentValue)?.toNumber() ?? 0);
  }, 0);

  // Allocation chart: assets only (liabilities are not asset allocations)
  const allocationByType = nonLiabilityAssets.reduce((acc, asset) => {
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
    ? formatMoney(currentValue.value, { currency: currentValue.currency || currency, locale, minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : '—';

  const fmtOpts = { currency, locale, minimumFractionDigits: 0 as const, maximumFractionDigits: 0 as const };

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
            <p className="text-xs text-muted-foreground mt-1">Assets minus liabilities</p>
          </CardContent>
        </Card>

        <a href={appHref('/assets')} className="block">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatMoney(totalAssetsValue, fmtOpts)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{nonLiabilityAssets.length} active asset{nonLiabilityAssets.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        </a>

        <a href={appHref('/asset-types')} className="block">
          <Card className={`hover:bg-accent transition-colors cursor-pointer h-full${totalLiabilitiesValue > 0 ? '' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalLiabilitiesValue > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                {totalLiabilitiesValue > 0 ? `−${formatMoney(totalLiabilitiesValue, fmtOpts)}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{liabilityAssets.length} liabilit{liabilityAssets.length !== 1 ? 'ies' : 'y'}</p>
            </CardContent>
          </Card>
        </a>
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
