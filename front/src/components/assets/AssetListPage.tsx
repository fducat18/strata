import { useState } from 'react';
import {
  useAssets, useAssetTypes, useCategories, useTags, useCreateAsset,
} from '@/lib/hooks';
import {
  Button, Card, CardContent, Input, Select, Badge,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Loading, EmptyState,
} from '@/components/ui';
import { Plus, Package, Search } from 'lucide-react';
import { formatQuantity, getAssetTypeIcon } from '@/lib/format';
import { useUIStore } from '@/stores/uiStore';

export function AssetListPage() {
  const { data: assets, isLoading, isError, refetch } = useAssets();
  const { data: assetTypes } = useAssetTypes();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const createMutation = useCreateAsset();

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDisposed, setShowDisposed] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newAssetTypeId, setNewAssetTypeId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <EmptyState
        title="Could not load assets"
        description="There was a problem fetching assets."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  let filtered = assets || [];
  if (!showDisposed) filtered = filtered.filter(a => !a.disposed);
  if (search) filtered = filtered.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  if (filterType) filtered = filtered.filter(a => a.assetType?.code === filterType);

  const handleCreate = async () => {
    if (!newName.trim() || !newAssetTypeId) return;
    try {
      await createMutation.mutateAsync({
        name: newName.trim(),
        assetTypeId: newAssetTypeId,
        quantity: newQuantity || undefined,
      });
      setNewName('');
      setNewQuantity('');
      setShowCreate(false);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const resetCreate = () => {
    setNewName('');
    setNewAssetTypeId('');
    setNewQuantity('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage all your assets.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Asset
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search assets"
              />
            </div>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-48" aria-label="Filter by asset type">
              <option value="">All Types</option>
              {assetTypes?.map(t => <option key={t.id} value={t.code}>{t.label}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showDisposed}
                onChange={e => setShowDisposed(e.target.checked)}
                className="rounded"
              />
              Show disposed
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Asset table */}
      {filtered.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(asset => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <a href={`/assets/${asset.id}`} className="font-medium hover:text-primary">
                        {asset.name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {getAssetTypeIcon(asset.assetType?.code || '')} {asset.assetType?.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatQuantity(asset.quantity)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {asset.categories?.map(c => <Badge key={c.id} variant="outline">{c.name}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {asset.tags?.map(t => <Badge key={t.id} variant="secondary">{t.name}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.disposed
                        ? <Badge variant="destructive">Disposed</Badge>
                        : <Badge variant="default">Active</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No assets found"
          description={search || filterType ? 'Try adjusting your filters.' : 'Create your first asset to get started.'}
          action={!search && !filterType ? (
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Asset</Button>
          ) : undefined}
        />
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={resetCreate}>
        <DialogHeader>
          <DialogTitle>Create Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="asset-name" className="text-sm font-medium">Name</label>
            <Input id="asset-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Bitcoin" className="mt-1" />
          </div>
          <div>
            <label htmlFor="asset-type" className="text-sm font-medium">Asset Type</label>
            <Select id="asset-type" value={newAssetTypeId} onChange={e => setNewAssetTypeId(e.target.value)} className="mt-1">
              <option value="">Select type...</option>
              {assetTypes?.map(t => <option key={t.id} value={t.id}>{getAssetTypeIcon(t.code)} {t.label}</option>)}
            </Select>
          </div>
          <div>
            <label htmlFor="asset-quantity" className="text-sm font-medium">Quantity (optional)</label>
            <Input id="asset-quantity" type="number" step="any" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} placeholder="e.g. 1.5" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetCreate}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!newName.trim() || !newAssetTypeId || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
