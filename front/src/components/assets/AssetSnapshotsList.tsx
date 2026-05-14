import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, DialogHeader, DialogTitle, DialogFooter, Input } from '@/components/ui';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { useUpdateAssetSnapshot, useDeleteAssetSnapshot } from '@/lib/hooks';
import { useUIStore } from '@/stores/uiStore';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { AssetSnapshot } from '@/lib/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number] | 'all';

interface Props {
  assetId: string;
  snapshots: AssetSnapshot[];
  acquisitionDate?: string | null;
  acquisitionPrice?: string | null;
  onAddSnapshot: () => void;
}

export function AssetSnapshotsList({ assetId, snapshots, acquisitionDate, acquisitionPrice, onAddSnapshot }: Props) {
  const locale = useLocale();
  const currency = useCurrency();
  const [editingSnapshot, setEditingSnapshot] = useState<AssetSnapshot | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [deletingSnapshot, setDeletingSnapshot] = useState<AssetSnapshot | null>(null);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [page, setPage] = useState(1);
  const updateSnapshot = useUpdateAssetSnapshot();
  const deleteSnapshot = useDeleteAssetSnapshot();

  const sorted = [...snapshots].sort(
    (a, b) => sortDir === 'desc'
      ? new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
      : new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(sorted.length / pageSize);
  const paginated = pageSize === 'all' ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSortToggle = () => {
    setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    setPage(1);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(val === 'all' ? 'all' : Number(val) as PageSizeOption);
    setPage(1);
  };

  const handleEditOpen = (s: AssetSnapshot) => {
    setEditingSnapshot(s);
    setEditValue(s.value);
    setEditDate(s.observedAt.slice(0, 10));
  };

  const handleEditSave = async () => {
    if (!editingSnapshot) return;
    try {
      await updateSnapshot.mutateAsync({
        assetId,
        snapshotId: editingSnapshot.id,
        data: {
          value: editValue,
          observedAt: new Date(editDate).toISOString(),
        },
      });
      setEditingSnapshot(null);
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message ?? (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSnapshot) return;
    try {
      await deleteSnapshot.mutateAsync({ assetId, snapshotId: deletingSnapshot.id });
      setDeletingSnapshot(null);
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message ?? (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const SortIcon = sortDir === 'desc' ? ChevronDown : ChevronUp;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Snapshots</CardTitle>
        <Button variant="outline" size="sm" onClick={onAddSnapshot} aria-label="Add snapshot">
          <Plus className="h-4 w-4" /> Add Snapshot
        </Button>
      </CardHeader>
      <CardContent>
        {sorted.length > 0 || acquisitionDate ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{sorted.length} snapshot{sorted.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="snap-page-size" className="text-muted-foreground">Show</label>
                <select
                  id="snap-page-size"
                  value={pageSize}
                  onChange={e => handlePageSizeChange(e.target.value)}
                  className="rounded border border-input bg-background px-2 py-0.5 text-xs"
                  aria-label="Snapshots per page"
                >
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={handleSortToggle}
                      className="flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer"
                      aria-label={`Sort by date ${sortDir === 'desc' ? 'ascending' : 'descending'}`}
                    >
                      Date
                      {sorted.length > 0
                        ? <SortIcon className="h-3.5 w-3.5" />
                        : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
                    </button>
                  </TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.observedAt, { locale })}</TableCell>
                    <TableCell className="font-mono">{formatMoney(s.value, { currency, locale, minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditOpen(s)}
                          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          aria-label="Edit snapshot"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSnapshot(s)}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label="Delete snapshot"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {acquisitionDate && (
                  <TableRow className="italic text-muted-foreground" aria-label="Acquisition date row">
                    <TableCell>{formatDate(acquisitionDate, { locale })} <span className="text-xs ml-1 not-italic">(acquired)</span></TableCell>
                    <TableCell className="font-mono">
                      {acquisitionPrice ? formatMoney(acquisitionPrice, { currency, locale, minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded border border-input disabled:opacity-40 hover:bg-accent transition-colors"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span className="text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded border border-input disabled:opacity-40 hover:bg-accent transition-colors"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4">No snapshots yet.</p>
        )}
      </CardContent>

      <Dialog open={!!editingSnapshot} onClose={() => setEditingSnapshot(null)}>
        <DialogHeader>
          <DialogTitle>Edit Snapshot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="snap-value" className="text-sm font-medium">Value (EUR)</label>
            <Input
              id="snap-value"
              type="number"
              step="0.01"
              min="0"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="snap-date" className="text-sm font-medium">Date</label>
            <Input
              id="snap-date"
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingSnapshot(null)}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            disabled={!editValue || !editDate || updateSnapshot.isPending}
          >
            {updateSnapshot.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deletingSnapshot}
        pending={deleteSnapshot.isPending}
        onClose={() => setDeletingSnapshot(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Snapshot"
        message="Are you sure you want to delete this snapshot? This action cannot be undone."
      />
    </Card>
  );
}
