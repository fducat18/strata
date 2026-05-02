import { useState } from 'react';
import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter, Input } from '@/components/ui';

interface Props {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSave: (value: string, observedAt: string) => Promise<void> | void;
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function SnapshotDialog({ open, pending, onClose, onSave }: Props) {
  const [value, setValue] = useState('');
  const [observedAt, setObservedAt] = useState(todayISODate);

  const handleSave = async () => {
    if (!value) return;
    await onSave(value, observedAt);
    setValue('');
    setObservedAt(todayISODate());
  };

  const handleClose = () => {
    setValue('');
    setObservedAt(todayISODate());
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader><DialogTitle>Record Snapshot</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <label htmlFor="snapshot-value" className="text-sm font-medium">Current Value</label>
          <Input
            id="snapshot-value"
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 25000.00"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="snapshot-date" className="text-sm font-medium">Observed on</label>
          <Input
            id="snapshot-date"
            type="date"
            value={observedAt}
            onChange={(e) => setObservedAt(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!value || pending}>
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
