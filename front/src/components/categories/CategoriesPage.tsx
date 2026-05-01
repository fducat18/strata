import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/lib/hooks';
import {
  Button, Card, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, Loading, EmptyState,
} from '@/components/ui';
import { Plus, FolderTree } from 'lucide-react';
import { buildCategoryTree } from '@/lib/types/category';
import { CategoryTreeNodeView } from './CategoryTreeNodeView';
import type { Category } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentId: z.string().optional(),
});
type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const [showCreate, setShowCreate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', parentId: '' },
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <FolderTree className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load categories.</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const tree = buildCategoryTree(categories || []);

  const onCloseDialog = () => {
    setShowCreate(false);
    reset();
  };

  const handleCreate = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync({
        name: data.name.trim(),
        parentId: data.parentId || undefined,
      });
      onCloseDialog();
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm('Delete this category?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: unknown) {
        const message = (err as any)?.message ?? 'An unexpected error occurred';
        useUIStore.getState().pushToast({ variant: 'error', message });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize your assets with hierarchical categories.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {tree.length > 0 ? (
            <div className="space-y-0.5">
              {tree.map(node => (
                <CategoryTreeNodeView key={node.id} node={node} onDelete={handleDelete} level={0} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FolderTree className="h-12 w-12" />}
              title="No categories yet"
              description="Create categories to organize your assets."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onClose={onCloseDialog}>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="text-sm font-medium">Name</label>
            <Input id="category-name" {...register('name')} placeholder="e.g. Real Estate" className="mt-1" />
            {errors.name && <p role="alert" className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="category-parent" className="text-sm font-medium">Parent Category (optional)</label>
            <Select id="category-parent" {...register('parentId')} className="mt-1">
              <option value="">None (top-level)</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseDialog}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
