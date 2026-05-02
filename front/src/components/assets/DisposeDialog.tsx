import { useState } from 'react';
import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter, Input } from '@/components/ui';

interface Props {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSave: (disposalDate: string, disposalPrice: string) => Promise<void> | void;
}

export function DisposeDialog({ open, pending, onClose, onSave }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [disposalDate, setDisposalDate] = useState(today);
  const [disposalPrice, setDisposalPrice] = useState('0.00');

  const handleSave = async () => {
    if (!disposalDate || !disposalPrice) return;
    await onSave(disposalDate, disposalPrice);
    setDisposalDate(today);
    setDisposalPrice('0.00');
  };

  const handleClose = () => {
    setDisposalDate(today);
    setDisposalPrice('0.00');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader><DialogTitle>Dispose Asset</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <label htmlFor="disposal-date" className="text-sm font-medium">Disposal Date</label>
          <Input
            id="disposal-date"
            type="date"
            value={disposalDate}
            onChange={(e) => setDisposalDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="disposal-price" className="text-sm font-medium">Disposal Price (EUR)</label>
          <Input
            id="disposal-price"
            type="number"
            step="0.01"
            min="0"
            value={disposalPrice}
            onChange={(e) => setDisposalPrice(e.target.value)}
            placeholder="e.g. 5000.00"
            className="mt-1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button
          variant="destructive"
          onClick={handleSave}
          disabled={!disposalDate || !disposalPrice || pending}
        >
          {pending ? 'Disposing...' : 'Dispose Asset'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
