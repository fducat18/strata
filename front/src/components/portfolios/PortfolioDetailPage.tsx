import { useState } from 'react';
import {
  usePortfolio, useAssets, usePortfolioSnapshots,
  useTakePortfolioSnapshot, useUpdatePortfolio, useDeletePortfolio,
} from '@/lib/hooks';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Badge, Loading, EmptyState,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui';
import { Camera, Edit, Trash2, ArrowLeft, Package } from 'lucide-react';
import { formatMoney, formatDate, formatDateTime, toDecimal, getAssetTypeIcon } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  portfolioId: string;
}

export function PortfolioDetailPage({ portfolioId }: Props) {
  const { data: portfolio, isLoading, isError, refetch } = usePortfolio(portfolioId);
  const { data: assets } = useAssets(portfolioId);
  const { data: snapshots } = usePortfolioSnapshots(portfolioId);
  const snapshotMutation = useTakePortfolioSnapshot();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const locale = useLocale();
  const currency = useCurrency();
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <EmptyState
        title="Could not load portfolio"
        description="There was a problem fetching this portfolio."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }
  if (!portfolio) return <EmptyState title="Portfolio not found" />;

  const activeAssets = assets?.filter(a => !a.disposed) || [];

  const chartData = (snapshots || [])
    .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime())
    .map(s => ({ date: formatDate(s.observedAt, { locale }), value: toDecimal(s.value)?.toNumber() ?? 0 }));

  const handleEdit = () => {
    setEditName(portfolio.name);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await updateMutation.mutateAsync({ id: portfolioId, data: { name: editName.trim() } });
    setShowEdit(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this portfolio and all its assets?')) {
      await deleteMutation.mutateAsync(portfolioId);
      window.location.href = '/portfolios';
    }
  };

  const handleSnapshot = async () => {
    await snapshotMutation.mutateAsync(portfolioId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/portfolios" className="text-muted-foreground hover:text-foreground" aria-label="Back to portfolios">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{portfolio.name}</h1>
          <p className="text-muted-foreground">{portfolio.baseCurrency} · Created {formatDate(portfolio.createdAt, { locale })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSnapshot} disabled={snapshotMutation.isPending}>
            <Camera className="h-4 w-4" /> Snapshot
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} aria-label="Delete portfolio">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Snapshot chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
                  formatter={(value) => [formatMoney(value as number, { currency: portfolio.baseCurrency, locale }), 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--chart-1)" fillOpacity={1} fill="url(#portfolioGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Assets table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assets ({activeAssets.length})</CardTitle>
          <a href="/assets">
            <Button variant="outline" size="sm"><Package className="h-4 w-4" /> Manage Assets</Button>
          </a>
        </CardHeader>
        <CardContent>
          {activeAssets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssets.map(asset => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <a href={`/assets/${asset.id}`} className="font-medium hover:text-primary">{asset.name}</a>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getAssetTypeIcon(asset.assetType?.code || '')} {asset.assetType?.label}
                      </span>
                    </TableCell>
                    <TableCell>{asset.quantity || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {asset.tags?.map(t => <Badge key={t.id} variant="secondary">{t.name}</Badge>)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No assets in this portfolio yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)}>
        <DialogHeader><DialogTitle>Edit Portfolio</DialogTitle></DialogHeader>
        <div>
          <label htmlFor="portfolio-edit-name" className="text-sm font-medium">Name</label>
          <Input id="portfolio-edit-name" value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Save</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
