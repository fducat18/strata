import { useState } from 'react';
import { Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/types/category';

interface Props {
  node: CategoryTreeNode;
  onDelete: (id: string) => void;
  level: number;
}

export function CategoryTreeNodeView({ node, onDelete, level }: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const Caret = expanded ? ChevronDown : ChevronRight;
  const FolderIcon = expanded && hasChildren ? FolderOpen : Folder;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent group"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="cursor-pointer"
            aria-label={expanded ? 'Collapse subcategories' : 'Expand subcategories'}
            aria-expanded={expanded}
          >
            <Caret className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <FolderIcon className={hasChildren && expanded ? 'h-4 w-4 text-primary' : 'h-4 w-4 text-muted-foreground'} />
        <span className="flex-1 text-sm font-medium">{node.name}</span>
        <button
          onClick={() => onDelete(node.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
          aria-label={`Delete category ${node.name}`}
          title="Delete category"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNodeView
              key={child.id}
              node={child}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
