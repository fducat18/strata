import { useState } from 'react';
import {
  useAsset, useAssetSnapshots, useTags, useCategories,
  useUpdateAsset, useDeleteAsset, useDisposeAsset,
  useCreateAssetSnapshot, useAddTagToAsset, useRemoveTagFromAsset,
  useAddCategoryToAsset, useRemoveCategoryFromAsset,
} from '@/lib/hooks';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Badge, Loading, EmptyState,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui';
import {
  ArrowLeft, Edit, Trash2, Ban, Camera, Plus, X, Tag, FolderTree,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatQuantity, getAssetTypeIcon } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  assetId: string;
}

export function AssetDetailPage({ assetId }: Props) {
  const { data: asset, isLoading } = useAsset(assetId);
  const { data: snapshots } = useAssetSnapshots(assetId);
  const { data: allTags } = useTags();
  const { data: allCategories } = useCategories();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const disposeMutation = useDisposeAsset();
  const snapshotMutation = useCreateAssetSnapshot();
  const addTagMutation = useAddTagToAsset();
  const removeTagMutation = useRemoveTagFromAsset();
  const addCategoryMutation = useAddCategoryToAsset();
  const removeCategoryMutation = useRemoveCategoryFromAsset();

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshotValue, setSnapshotValue] = useState('');

  if (isLoading) return <Loading />;
  if (!asset) return <EmptyState title="Asset not found" />;

  const chartData = (snapshots || [])
    .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime())
    .map(s => ({ date: formatDate(s.observedAt), value: parseFloat(s.value) }));

  const assetTagIds = new Set(asset.tags?.map(t => t.id) || []);
  const assetCatIds = new Set(asset.categories?.map(c => c.id) || []);
  const availableTags = allTags?.filter(t => !assetTagIds.has(t.id)) || [];
  const availableCategories = allCategories?.filter(c => !assetCatIds.has(c.id)) || [];

  const handleEdit = () => {
    setEditName(asset.name);
    setEditQuantity(asset.quantity || '');
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await updateMutation.mutateAsync({
      id: assetId,
      data: { name: editName.trim(), quantity: editQuantity || undefined },
    });
    setShowEdit(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this asset permanently?')) {
      await deleteMutation.mutateAsync(assetId);
      window.location.href = '/assets';
    }
  };

  const handleDispose = async () => {
    if (confirm('Mark this asset as disposed?')) {
      await disposeMutation.mutateAsync(assetId);
    }
  };

  const handleSnapshot = async () => {
    if (!snapshotValue) return;
    await snapshotMutation.mutateAsync({
      id: assetId,
      data: { value: snapshotValue, observedAt: new Date().toISOString() },
    });
    setSnapshotValue('');
    setShowSnapshot(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/assets" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getAssetTypeIcon(asset.assetType?.code || '')}</span>
            <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
            {asset.disposed && <Badge variant="destructive">Disposed</Badge>}
          </div>
          <p className="text-muted-foreground">
            {asset.assetType?.label} · Qty: {formatQuantity(asset.quantity)} · Created {formatDate(asset.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSnapshot(true)}>
            <Camera className="h-4 w-4" /> Snapshot
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" /> Edit
          </Button>
          {!asset.disposed && (
            <Button variant="outline" size="sm" onClick={handleDispose}>
              <Ban className="h-4 w-4" /> Dispose
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Value chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Value History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-fg)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-color)', borderRadius: '0.375rem' }}
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--chart-2)" fillOpacity={1} fill="url(#assetGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tags */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4" /> Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {asset.tags?.map(tag => (
                <Badge key={tag.id} variant="secondary" className="gap-1">
                  {tag.name}
                  <button
                    onClick={() => removeTagMutation.mutate({ assetId, tagId: tag.id })}
                    className="ml-1 hover:text-destructive cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(!asset.tags || asset.tags.length === 0) && (
                <span className="text-sm text-muted-foreground">No tags</span>
              )}
            </div>
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => addTagMutation.mutate({ assetId, tagId: tag.id })}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> {tag.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FolderTree className="h-4 w-4" /> Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {asset.categories?.map(cat => (
                <Badge key={cat.id} variant="outline" className="gap-1">
                  {cat.name}
                  <button
                    onClick={() => removeCategoryMutation.mutate({ assetId, categoryId: cat.id })}
                    className="ml-1 hover:text-destructive cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(!asset.categories || asset.categories.length === 0) && (
                <span className="text-sm text-muted-foreground">No categories</span>
              )}
            </div>
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => addCategoryMutation.mutate({ assetId, categoryId: cat.id })}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> {cat.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snapshots table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Snapshots</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowSnapshot(true)}>
            <Plus className="h-4 w-4" /> Add Snapshot
          </Button>
        </CardHeader>
        <CardContent>
          {snapshots && snapshots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots
                  .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())
                  .map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{formatDateTime(s.observedAt)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(s.value)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No snapshots yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)}>
        <DialogHeader><DialogTitle>Edit Asset</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input type="number" step="any" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Save</Button>
        </DialogFooter>
      </Dialog>

      {/* Snapshot dialog */}
      <Dialog open={showSnapshot} onClose={() => setShowSnapshot(false)}>
        <DialogHeader><DialogTitle>Record Snapshot</DialogTitle></DialogHeader>
        <div>
          <label className="text-sm font-medium">Current Value</label>
          <Input type="number" step="0.01" value={snapshotValue} onChange={e => setSnapshotValue(e.target.value)} placeholder="e.g. 25000.00" className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSnapshot(false)}>Cancel</Button>
          <Button onClick={handleSnapshot} disabled={!snapshotValue || snapshotMutation.isPending}>
            {snapshotMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
