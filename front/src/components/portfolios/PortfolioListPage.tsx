import { useState } from 'react';
import { usePortfolios, useCreatePortfolio, useDeletePortfolio } from '@/lib/hooks';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, Loading, EmptyState,
} from '@/components/ui';
import { Plus, Briefcase, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function PortfolioListPage() {
  const { data: portfolios, isLoading, isError, refetch } = usePortfolios();
  const createMutation = useCreatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EUR');

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <EmptyState
        title="Could not load portfolios"
        description="There was a problem fetching portfolios."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name: name.trim(), baseCurrency: currency });
    setName('');
    setCurrency('EUR');
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this portfolio? All associated assets will be removed.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">Manage your investment portfolios.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Portfolio
        </Button>
      </div>

      {portfolios && portfolios.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map(p => (
            <Card key={p.id} className="group relative">
              <a href={`/portfolios/${p.id}`} className="block">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium">{p.baseCurrency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </CardContent>
              </a>
              <button
                onClick={(e) => { e.preventDefault(); handleDelete(p.id); }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                title="Delete portfolio"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No portfolios yet"
          description="Create your first portfolio to start tracking your assets."
          action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Portfolio</Button>}
        />
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <DialogTitle>Create Portfolio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Main Portfolio"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Base Currency</label>
            <Select value={currency} onChange={e => setCurrency(e.target.value)} className="mt-1">
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CHF">CHF — Swiss Franc</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
