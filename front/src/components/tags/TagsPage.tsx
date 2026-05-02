import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTags, useCreateTag, useDeleteTag, useUpdateTag } from '@/lib/hooks';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Badge, Loading, EmptyState,
} from '@/components/ui';
import { Plus, Tags as TagsIcon, Trash2, Pencil, Check, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
});
type TagFormData = z.infer<typeof tagSchema>;

export function TagsPage() {
  const { data: tags, isLoading, isError, refetch } = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();
  const updateMutation = useUpdateTag();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    mode: 'onChange',
  });

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <EmptyState
        title="Could not load tags"
        description="There was a problem fetching tags."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const handleCreate = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      reset();
      setShowCreate(false);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  });

  const handleEdit = async (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    try {
      await updateMutation.mutateAsync({ id, name: trimmed });
      setEditingId(null);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const handleClose = () => {
    reset();
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tag?')) {
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
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">Label your assets with tags for quick filtering.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Tag
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 rounded-lg border border-border px-4 py-2 hover:bg-accent transition-colors"
                >
                  <TagsIcon className="h-4 w-4 text-muted-foreground" />
                  {editingId === tag.id ? (
                    <>
                      <input
                        className="text-sm font-medium border rounded px-1 py-0.5 bg-background w-32"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(tag.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        aria-label={`Edit name for tag ${tag.name}`}
                      />
                      <button
                        onClick={() => handleEdit(tag.id)}
                        className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        aria-label="Save tag name"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        aria-label="Cancel edit"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{tag.name}</span>
                      <button
                        onClick={() => { setEditValue(tag.name); setEditingId(tag.id); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity cursor-pointer"
                        title="Edit tag"
                        aria-label={`Edit tag ${tag.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                        title="Delete tag"
                        aria-label={`Delete tag ${tag.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<TagsIcon className="h-12 w-12" />}
              title="No tags yet"
              description="Create tags to label and filter your assets."
              action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Tag</Button>}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        <div>
          <label htmlFor="tag-name" className="text-sm font-medium">Name</label>
          <Input id="tag-name" {...register('name')} placeholder="e.g. high-yield" className="mt-1" />
          {errors.name && (
            <p role="alert" className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!isValid || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
