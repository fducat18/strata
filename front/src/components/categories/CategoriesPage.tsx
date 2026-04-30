import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/lib/hooks';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogHeader, DialogTitle, DialogFooter,
  Input, Select, Loading, EmptyState,
} from '@/components/ui';
import { Plus, FolderTree, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { Category } from '@/lib/types';

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: Category[] = [];

  categories.forEach(c => map.set(c.id, { ...c, children: [] }));
  categories.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  });

  return roots;
}

interface TreeNodeProps {
  category: Category & { children?: Category[] };
  onDelete: (id: string) => void;
  level: number;
}

function TreeNode({ category, onDelete, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent group"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="cursor-pointer">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {expanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm font-medium">{category.name}</span>
        <button
          onClick={() => onDelete(category.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
          title="Delete category"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && hasChildren && (
        <div>
          {category.children!.map(child => (
            <TreeNode key={child.id} category={child as any} onDelete={onDelete} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');

  if (isLoading) return <Loading />;

  const tree = buildTree(categories || []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({
      name: newName.trim(),
      parentId: newParentId || undefined,
    });
    setNewName('');
    setNewParentId('');
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this category?')) {
      await deleteMutation.mutateAsync(id);
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
              {tree.map(cat => (
                <TreeNode key={cat.id} category={cat as any} onDelete={handleDelete} level={0} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FolderTree className="h-12 w-12" />}
              title="No categories yet"
              description="Create categories to organize your assets."
              action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Category</Button>}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Real Estate" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Parent Category (optional)</label>
            <Select value={newParentId} onChange={e => setNewParentId(e.target.value)} className="mt-1">
              <option value="">None (top-level)</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
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
