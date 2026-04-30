import { Badge, Button } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Ban, Camera } from 'lucide-react';
import { formatDate, formatQuantity, getAssetTypeIcon } from '@/lib/format';
import { useLocale } from '@/stores/settingsStore';
import type { Asset } from '@/lib/types';

interface Props {
  asset: Asset;
  onSnapshot: () => void;
  onEdit: () => void;
  onDispose: () => void;
  onDelete: () => void;
}

export function AssetHeader({ asset, onSnapshot, onEdit, onDispose, onDelete }: Props) {
  const locale = useLocale();
  return (
    <div className="flex items-center gap-4">
      <a href="/assets" className="text-muted-foreground hover:text-foreground" aria-label="Back to assets">
        <ArrowLeft className="h-5 w-5" />
      </a>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{getAssetTypeIcon(asset.assetType?.code || '')}</span>
          <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
          {asset.disposed && <Badge variant="destructive">Disposed</Badge>}
        </div>
        <p className="text-muted-foreground">
          {asset.assetType?.label} · Qty: {formatQuantity(asset.quantity)} · Created {formatDate(asset.createdAt, { locale })}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onSnapshot} aria-label="Record snapshot">
          <Camera className="h-4 w-4" /> Snapshot
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} aria-label="Edit asset">
          <Edit className="h-4 w-4" /> Edit
        </Button>
        {!asset.disposed && (
          <Button variant="outline" size="sm" onClick={onDispose} aria-label="Mark asset as disposed">
            <Ban className="h-4 w-4" /> Dispose
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onDelete} aria-label="Delete asset">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
