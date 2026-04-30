import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { Tag, Plus, X } from 'lucide-react';
import type { Asset, Tag as TagType } from '@/lib/types';

interface Props {
  asset: Asset;
  availableTags: TagType[];
  onAdd: (tagId: string) => void;
  onRemove: (tagId: string) => void;
}

export function AssetTagsCard({ asset, availableTags, onAdd, onRemove }: Props) {
  const tags = asset.tags ?? [];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4" /> Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                onClick={() => onRemove(tag.id)}
                aria-label={`Remove tag ${tag.name}`}
                className="ml-1 hover:text-destructive cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {tags.length === 0 && <span className="text-sm text-muted-foreground">No tags</span>}
        </div>
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onAdd(tag.id)}
                aria-label={`Add tag ${tag.name}`}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> {tag.name}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
