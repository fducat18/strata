import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/lib/hooks';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Badge, Loading, EmptyState,
} from '@/components/ui';
import { Plus, Tags as TagsIcon, Trash2 } from 'lucide-react';

export function TagsPage() {
  const { data: tags, isLoading, isError, refetch } = useTags();
  const createMutation = useCreateTag();
  const deleteMutation = useDeleteTag();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

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

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({ name: newName.trim() });
    setNewName('');
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tag?')) {
      await deleteMutation.mutateAsync(id);
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
                  <span className="font-medium">{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                    title="Delete tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. high-yield" className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
