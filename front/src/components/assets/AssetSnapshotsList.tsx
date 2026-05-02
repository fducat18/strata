import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog, DialogHeader, DialogTitle, DialogFooter, Input } from '@/components/ui';
import { Plus, Pencil } from 'lucide-react';
import { formatMoney, formatDateTime } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import { useUpdateAssetSnapshot } from '@/lib/hooks';
import { useUIStore } from '@/stores/uiStore';
import type { AssetSnapshot } from '@/lib/types';

interface Props {
  assetId: string;
  snapshots: AssetSnapshot[];
  onAddSnapshot: () => void;
}

export function AssetSnapshotsList({ assetId, snapshots, onAddSnapshot }: Props) {
  const locale = useLocale();
  const currency = useCurrency();
  const [editingSnapshot, setEditingSnapshot] = useState<AssetSnapshot | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const updateSnapshot = useUpdateAssetSnapshot();

  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  );

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Snapshots</CardTitle>
        <Button variant="outline" size="sm" onClick={onAddSnapshot} aria-label="Add snapshot">
          <Plus className="h-4 w-4" /> Add Snapshot
        </Button>
      </CardHeader>
      <CardContent>
        {sorted.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{formatDateTime(s.observedAt, locale)}</TableCell>
                  <TableCell className="font-mono">{formatMoney(s.value, { currency, locale })}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleEditOpen(s)}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      aria-label="Edit snapshot"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </Card>
  );
}
