import { useState, useEffect } from 'react';
import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter, Input } from '@/components/ui';
import type { Asset } from '@/lib/types';

interface Props {
  open: boolean;
  asset: Asset;
  onClose: () => void;
  onSave: (values: { name: string; quantity?: string }) => Promise<void> | void;
}

export function AssetEditDialog({ open, asset, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (open) {
      setName(asset.name);
      setQuantity(asset.quantity ?? '');
    }
  }, [open, asset]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), quantity: quantity || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader><DialogTitle>Edit Asset</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <label htmlFor="asset-edit-name" className="text-sm font-medium">Name</label>
          <Input id="asset-edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label htmlFor="asset-edit-qty" className="text-sm font-medium">Quantity</label>
          <Input id="asset-edit-qty" type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
      </DialogFooter>
    </Dialog>
  );
}
