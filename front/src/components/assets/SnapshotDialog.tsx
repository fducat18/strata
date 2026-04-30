import { useState } from 'react';
import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter, Input } from '@/components/ui';

interface Props {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void> | void;
}

export function SnapshotDialog({ open, pending, onClose, onSave }: Props) {
  const [value, setValue] = useState('');
  const handleSave = async () => {
    if (!value) return;
    await onSave(value);
    setValue('');
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader><DialogTitle>Record Snapshot</DialogTitle></DialogHeader>
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
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!value || pending}>
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
