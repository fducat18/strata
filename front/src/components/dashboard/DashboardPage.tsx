import { usePortfolios, useAssets } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardContent, Loading } from '@/components/ui';
import { getAssetTypeIcon } from '@/lib/format';
import { Briefcase, Package, TrendingUp } from 'lucide-react';
import { NetWorthChart } from './NetWorthChart';
import { AllocationChart } from './AllocationChart';

export function DashboardPage() {
  const { data: portfolios, isLoading: loadingPortfolios } = usePortfolios();
  const { data: assets, isLoading: loadingAssets } = useAssets();

  if (loadingPortfolios || loadingAssets) return <Loading />;

  const activeAssets = assets?.filter(a => !a.disposed) || [];
  const totalPortfolios = portfolios?.length || 0;
  const totalAssets = activeAssets.length;

  // Group assets by type for allocation
  const allocationByType = activeAssets.reduce((acc, asset) => {
    const type = asset.assetType?.code || 'OTHER';
    const label = asset.assetType?.label || 'Other';
    if (!acc[type]) acc[type] = { code: type, label, count: 0 };
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { code: string; label: string; count: number }>);

  const allocationData = Object.values(allocationByType).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview at a glance.</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Portfolios</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPortfolios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
          </CardContent>
        </Card>

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
            <NetWorthChart portfolios={portfolios || []} />
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

      {/* Recent portfolios */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolios</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolios && portfolios.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {portfolios.map(p => (
                <a
                  key={p.id}
                  href={`/portfolios/${p.id}`}
                  className="rounded-lg border border-border p-4 hover:bg-accent transition-colors"
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.baseCurrency}</div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No portfolios yet. <a href="/portfolios" className="text-primary hover:underline">Create one</a>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
