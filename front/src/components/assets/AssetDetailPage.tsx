import { useState } from 'react';
import {
  useAsset, useAssetSnapshots, useTags, useCategories,
  useUpdateAsset, useDeleteAsset, useDisposeAsset,
  useCreateAssetSnapshot, useAddTagToAsset, useRemoveTagFromAsset,
  useAddCategoryToAsset, useRemoveCategoryFromAsset,
} from '@/lib/hooks';
import { Loading, EmptyState, Button } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { AssetHeader } from './AssetHeader';
import { AssetValueChart } from './AssetValueChart';
import { AssetSnapshotsList } from './AssetSnapshotsList';
import { AssetTagsCard } from './AssetTagsCard';
import { AssetCategoriesCard } from './AssetCategoriesCard';
import { AssetEditDialog } from './AssetEditDialog';
import { SnapshotDialog } from './SnapshotDialog';

interface Props {
  assetId: string;
}

export function AssetDetailPage({ assetId }: Props) {
  const { data: asset, isLoading, isError } = useAsset(assetId);
  const { data: snapshots = [] } = useAssetSnapshots(assetId);
  const { data: allTags = [] } = useTags();
  const { data: allCategories = [] } = useCategories();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const disposeMutation = useDisposeAsset();
  const snapshotMutation = useCreateAssetSnapshot();
  const addTagMutation = useAddTagToAsset();
  const removeTagMutation = useRemoveTagFromAsset();
  const addCategoryMutation = useAddCategoryToAsset();
  const removeCategoryMutation = useRemoveCategoryFromAsset();

  const [showEdit, setShowEdit] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);

  if (isLoading) return <Loading />;

  if (!asset) {
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground">Failed to load asset. Please try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      );
    }
    return <EmptyState title="Asset not found" />;
  }

  const assetTagIds = new Set(asset.tags?.map(t => t.id) || []);
  const assetCatIds = new Set(asset.categories?.map(c => c.id) || []);
  const availableTags = allTags.filter(t => !assetTagIds.has(t.id));
  const availableCategories = allCategories.filter(c => !assetCatIds.has(c.id));

  const handleSaveEdit = async (values: { name: string; quantity?: string }) => {
    try {
      await updateMutation.mutateAsync({ id: assetId, data: values });
      setShowEdit(false);
    } catch (err: unknown) {
      useUIStore.getState().pushToast({ variant: 'error', message: (err as any)?.message ?? 'An unexpected error occurred' });
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this asset permanently?')) {
      try {
        await deleteMutation.mutateAsync(assetId);
        window.location.assign('/assets');
      } catch (err: unknown) {
        useUIStore.getState().pushToast({ variant: 'error', message: (err as any)?.message ?? 'An unexpected error occurred' });
      }
    }
  };

  const handleDispose = async () => {
    if (confirm('Mark this asset as disposed?')) {
      try {
        await disposeMutation.mutateAsync(assetId);
      } catch (err: unknown) {
        useUIStore.getState().pushToast({ variant: 'error', message: (err as any)?.message ?? 'An unexpected error occurred' });
      }
    }
  };

  const handleSnapshot = async (value: string) => {
    try {
      await snapshotMutation.mutateAsync({
        id: assetId,
        data: { value, observedAt: new Date().toISOString() },
      });
      setShowSnapshot(false);
    } catch (err: unknown) {
      useUIStore.getState().pushToast({ variant: 'error', message: (err as any)?.message ?? 'An unexpected error occurred' });
    }
  };

  return (
    <div className="space-y-6">
      <AssetHeader
        asset={asset}
        onSnapshot={() => setShowSnapshot(true)}
        onEdit={() => setShowEdit(true)}
        onDispose={handleDispose}
        onDelete={handleDelete}
      />

      <AssetValueChart snapshots={snapshots} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AssetTagsCard
          asset={asset}
          availableTags={availableTags}
          onAdd={(tagId) => addTagMutation.mutate({ assetId, tagId })}
          onRemove={(tagId) => removeTagMutation.mutate({ assetId, tagId })}
        />
        <AssetCategoriesCard
          asset={asset}
          availableCategories={availableCategories}
          onAdd={(categoryId) => addCategoryMutation.mutate({ assetId, categoryId })}
          onRemove={(categoryId) => removeCategoryMutation.mutate({ assetId, categoryId })}
        />
      </div>

      <AssetSnapshotsList
        snapshots={snapshots}
        onAddSnapshot={() => setShowSnapshot(true)}
      />

      <AssetEditDialog
        open={showEdit}
        asset={asset}
        onClose={() => setShowEdit(false)}
        onSave={handleSaveEdit}
      />

      <SnapshotDialog
        open={showSnapshot}
        pending={snapshotMutation.isPending}
        onClose={() => setShowSnapshot(false)}
        onSave={handleSnapshot}
      />
    </div>
  );
}
