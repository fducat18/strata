import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { FolderTree, Plus, X } from 'lucide-react';
import type { Asset, Category } from '@/lib/types';

interface Props {
  asset: Asset;
  availableCategories: Category[];
  onAdd: (categoryId: string) => void;
  onRemove: (categoryId: string) => void;
}

export function AssetCategoriesCard({ asset, availableCategories, onAdd, onRemove }: Props) {
  const categories = asset.categories ?? [];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><FolderTree className="h-4 w-4" /> Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <Badge key={cat.id} variant="outline" className="gap-1">
              {cat.name}
              <button
                onClick={() => onRemove(cat.id)}
                aria-label={`Remove category ${cat.name}`}
                className="ml-1 hover:text-destructive cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {categories.length === 0 && <span className="text-sm text-muted-foreground">No categories</span>}
        </div>
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onAdd(cat.id)}
                aria-label={`Add category ${cat.name}`}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> {cat.name}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
