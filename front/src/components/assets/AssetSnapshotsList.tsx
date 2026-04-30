import { Button, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Plus } from 'lucide-react';
import { formatMoney, formatDateTime } from '@/lib/format';
import { useLocale, useCurrency } from '@/stores/settingsStore';
import type { AssetSnapshot } from '@/lib/types';

interface Props {
  snapshots: AssetSnapshot[];
  onAddSnapshot: () => void;
}

export function AssetSnapshotsList({ snapshots, onAddSnapshot }: Props) {
  const locale = useLocale();
  const currency = useCurrency();
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  );

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{formatDateTime(s.observedAt, locale)}</TableCell>
                  <TableCell className="font-mono">{formatMoney(s.value, { currency, locale })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground py-4">No snapshots yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
