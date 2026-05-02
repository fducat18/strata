import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from '@/lib/hooks';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Loading,
  EmptyState,
} from '@/components/ui';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import type { AssetType } from '@/lib/types';

const GROUP_COLORS: Record<string, string> = {
  FINANCIAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REAL_ESTATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PERSONAL_PROPERTY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PHYSICAL_COLLECTIONS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LIABILITIES: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
};

const GROUPS = Object.keys(GROUP_COLORS) as Array<keyof typeof GROUP_COLORS>;

const groupEnum = z.enum(['FINANCIAL', 'REAL_ESTATE', 'PERSONAL_PROPERTY', 'PHYSICAL_COLLECTIONS', 'LIABILITIES', 'OTHER']);

const createSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits, underscores only'),
  label: z.string().min(1, 'Label is required').max(100),
  group: groupEnum,
});
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100),
  group: groupEnum,
});
type EditFormData = z.infer<typeof editSchema>;

export function AssetTypesPage() {
  const { data: assetTypes, isLoading, isError, refetch } = useAssetTypes();
  const createMutation = useCreateAssetType();
  const updateMutation = useUpdateAssetType();
  const deleteMutation = useDeleteAssetType();

  const [showCreate, setShowCreate] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: { group: 'FINANCIAL' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
  });

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <EmptyState
        title="Could not load asset types"
        description="There was a problem fetching asset types."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const handleCreate = createForm.handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      createForm.reset();
      setShowCreate(false);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  });

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (!editingType) return;
    try {
      await updateMutation.mutateAsync({ id: editingType.id, ...data });
      setEditingType(null);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  });

  const handleDelete = async (type: AssetType) => {
    if (!confirm(`Delete asset type "${type.label}"? This will fail if any assets use this type.`)) return;
    try {
      await deleteMutation.mutateAsync(type.id);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const openEdit = (type: AssetType) => {
    editForm.reset({ label: type.label, group: type.group as EditFormData['group'] });
    setEditingType(type);
  };

  const handleCloseCreate = () => {
    createForm.reset();
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Types</h1>
          <p className="text-muted-foreground">Manage asset type definitions and group assignments.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add new type
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {assetTypes && assetTypes.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-6 font-medium">Code</th>
                  <th className="pb-3 pr-6 font-medium">Label</th>
                  <th className="pb-3 pr-6 font-medium">Group</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assetTypes.map((type) => (
                  <tr key={type.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-3 pr-6 font-mono text-xs font-medium text-muted-foreground">{type.code}</td>
                    <td className="py-3 pr-6 font-medium">{type.label}</td>
                    <td className="py-3 pr-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${GROUP_COLORS[type.group] ?? GROUP_COLORS.OTHER}`}>
                        {type.group}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(type)}
                          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          aria-label={`Edit asset type ${type.code}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label={`Delete asset type ${type.code}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={<Layers className="h-12 w-12" />}
              title="No asset types"
              description="Create asset types to categorize your assets."
              action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add new type</Button>}
            />
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={handleCloseCreate}>
        <DialogHeader>
          <DialogTitle>Create Asset Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="at-code" className="text-sm font-medium">Code</label>
            <Input
              id="at-code"
              {...createForm.register('code')}
              placeholder="e.g. CRYPTO_ETF"
              className="mt-1 font-mono"
              aria-label="Code"
            />
            {createForm.formState.errors.code && (
              <p role="alert" className="text-sm text-destructive mt-1">{createForm.formState.errors.code.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="at-label" className="text-sm font-medium">Label</label>
            <Input
              id="at-label"
              {...createForm.register('label')}
              placeholder="e.g. Crypto ETF"
              className="mt-1"
              aria-label="Label"
            />
            {createForm.formState.errors.label && (
              <p role="alert" className="text-sm text-destructive mt-1">{createForm.formState.errors.label.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="at-group" className="text-sm font-medium">Group</label>
            <select
              id="at-group"
              {...createForm.register('group')}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Group"
            >
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseCreate}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!createForm.formState.isValid || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingType} onClose={() => setEditingType(null)}>
        <DialogHeader>
          <DialogTitle>Edit Asset Type</DialogTitle>
        </DialogHeader>
        {editingType && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Code: <span className="font-mono font-medium text-foreground">{editingType.code}</span></p>
            </div>
            <div>
              <label htmlFor="edit-label" className="text-sm font-medium">Label</label>
              <Input
                id="edit-label"
                {...editForm.register('label')}
                className="mt-1"
                aria-label="Label"
              />
              {editForm.formState.errors.label && (
                <p role="alert" className="text-sm text-destructive mt-1">{editForm.formState.errors.label.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="edit-group" className="text-sm font-medium">Group</label>
              <select
                id="edit-group"
                {...editForm.register('group')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                aria-label="Group"
              >
                {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            disabled={!editForm.formState.isValid || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
