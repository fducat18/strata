import { useState, useEffect } from 'react';
import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter, Input, Select } from '@/components/ui';
import type { Asset, AssetType, Category, Tag } from '@/lib/types';
import { getAssetTypeIcon } from '@/lib/format';

interface EditValues {
  name: string;
  assetTypeId: string;
  quantity?: string;
  categoryIds: string[];
  tagIds: string[];
  acquisitionDate: string;
}

interface Props {
  open: boolean;
  asset: Asset;
  assetTypes: AssetType[];
  allCategories: Category[];
  allTags: Tag[];
  onClose: () => void;
  onSave: (values: EditValues) => Promise<void> | void;
}

export function AssetEditDialog({ open, asset, assetTypes, allCategories, allTags, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [assetTypeId, setAssetTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [acquisitionDate, setAcquisitionDate] = useState('');

  useEffect(() => {
    if (open) {
      setName(asset.name);
      setAssetTypeId(asset.assetType?.id ?? '');
      setQuantity(asset.quantity ?? '');
      setCategoryIds(asset.categories?.map(c => c.id) ?? []);
      setTagIds(asset.tags?.map(t => t.id) ?? []);
      const acquireTx = asset.transactions?.find(t => t.type === 'ACQUIRE');
      setAcquisitionDate(asset.acquisitionDate?.slice(0, 10) ?? (acquireTx ? acquireTx.occurredAt.slice(0, 10) : ''));
    }
  }, [open, asset]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      assetTypeId,
      quantity: quantity || undefined,
      categoryIds,
      tagIds,
      acquisitionDate,
    });
    onClose();
  };

  const toggleCategory = (id: string) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
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
          <label htmlFor="asset-edit-type" className="text-sm font-medium">Asset Type</label>
          <Select id="asset-edit-type" value={assetTypeId} onChange={(e) => setAssetTypeId(e.target.value)} className="mt-1">
            <option value="">Select type...</option>
            {assetTypes.map(t => (
              <option key={t.id} value={t.id}>{getAssetTypeIcon(t.code)} {t.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="asset-edit-qty" className="text-sm font-medium">Quantity</label>
          <Input id="asset-edit-qty" type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label htmlFor="asset-edit-acq-date" className="text-sm font-medium">Acquisition Date</label>
          <Input id="asset-edit-acq-date" type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="mt-1" />
        </div>
        {allCategories.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Categories</p>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => (
                <label key={c.id} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="rounded"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {allTags.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Tags</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(t => (
                <label key={t.id} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(t.id)}
                    onChange={() => toggleTag(t.id)}
                    className="rounded"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
      </DialogFooter>
    </Dialog>
  );
}
