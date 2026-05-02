import { useState } from 'react';
import {
  useAssets, useAssetTypes, useCategories, useTags, useCreateAsset, useUpdateAsset,
} from '@/lib/hooks';
import {
  Button, Card, CardContent, Input, Select, Badge,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Loading, EmptyState,
} from '@/components/ui';
import { Plus, Package, Search, Pencil } from 'lucide-react';
import { formatQuantity, getAssetTypeIcon, formatMoney } from '@/lib/format';
import { useUIStore } from '@/stores/uiStore';
import { AssetEditDialog } from './AssetEditDialog';
import type { Asset } from '@/lib/types';

export function AssetListPage() {
  const { data: assets, isLoading, isError, refetch } = useAssets();
  const { data: assetTypes } = useAssetTypes();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDisposed, setShowDisposed] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newAssetTypeId, setNewAssetTypeId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newAcquisitionDate, setNewAcquisitionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newAcquisitionPrice, setNewAcquisitionPrice] = useState('');
  const [newCategoryIds, setNewCategoryIds] = useState<string[]>([]);
  const [newTagIds, setNewTagIds] = useState<string[]>([]);

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
    if (!newName.trim() || !newAssetTypeId || !newAcquisitionPrice) return;
    try {
      const createdAsset = await createMutation.mutateAsync({
        name: newName.trim(),
        assetTypeId: newAssetTypeId,
        quantity: newQuantity || undefined,
        acquisitionDate: newAcquisitionDate,
        acquisitionPrice: newAcquisitionPrice,
      });
      if ((newCategoryIds.length > 0 || newTagIds.length > 0) && createdAsset) {
        await updateMutation.mutateAsync({
          id: createdAsset.id,
          data: {
            categoryIds: newCategoryIds,
            tagIds: newTagIds,
          },
        });
      }
      setNewName('');
      setNewQuantity('');
      setNewAcquisitionDate(new Date().toISOString().slice(0, 10));
      setNewAcquisitionPrice('');
      setNewCategoryIds([]);
      setNewTagIds([]);
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
    setNewAcquisitionDate(new Date().toISOString().slice(0, 10));
    setNewAcquisitionPrice('');
    setNewCategoryIds([]);
    setNewTagIds([]);
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
                  <TableHead>Current Value</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(asset => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <a href={`/assets/${asset.id}`} className="font-medium hover:text-primary">
                          {asset.name}
                        </a>
                        {asset.quantity != null && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {formatQuantity(asset.quantity)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {getAssetTypeIcon(asset.assetType?.code || '')} {asset.assetType?.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatMoney(asset.currentValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
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
                    <TableCell className="text-right">
                      <button
                        onClick={() => setEditingAsset(asset)}
                        className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        aria-label={`Edit ${asset.name}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
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
          <div>
            <label htmlFor="asset-acquisition-date" className="text-sm font-medium">Acquisition Date</label>
            <Input id="asset-acquisition-date" type="date" value={newAcquisitionDate} onChange={e => setNewAcquisitionDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label htmlFor="asset-acquisition-price" className="text-sm font-medium">Acquisition Price (EUR)</label>
            <Input id="asset-acquisition-price" type="number" step="0.01" min="0" value={newAcquisitionPrice} onChange={e => setNewAcquisitionPrice(e.target.value)} placeholder="e.g. 10000.00" className="mt-1" />
          </div>
          {categories && categories.length > 0 && (
            <div>
              <label className="text-sm font-medium">Categories (optional)</label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border border-input rounded-md p-2">
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCategoryIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCategoryIds(prev => [...prev, c.id]);
                        } else {
                          setNewCategoryIds(prev => prev.filter(id => id !== c.id));
                        }
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {tags && tags.length > 0 && (
            <div>
              <label className="text-sm font-medium">Tags (optional)</label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border border-input rounded-md p-2">
                {tags.map(t => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTagIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTagIds(prev => [...prev, t.id]);
                        } else {
                          setNewTagIds(prev => prev.filter(id => id !== t.id));
                        }
                      }}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetCreate}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!newName.trim() || !newAssetTypeId || !newAcquisitionPrice || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>

      {editingAsset && assetTypes && categories && tags && (
        <AssetEditDialog
          asset={editingAsset}
          open={!!editingAsset}
          assetTypes={assetTypes}
          allCategories={categories}
          allTags={tags}
          onClose={() => setEditingAsset(null)}
          onSave={async (values) => {
            try {
              await updateMutation.mutateAsync({ id: editingAsset.id, data: values });
              setEditingAsset(null);
            } catch (err: unknown) {
              const message = (err as any)?.message ?? 'An unexpected error occurred';
              useUIStore.getState().pushToast({ variant: 'error', message });
            }
          }}
        />
      )}
    </div>
  );
}
