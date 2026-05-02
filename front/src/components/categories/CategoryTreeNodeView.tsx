import { useState } from 'react';
import { Trash2, ChevronRight, ChevronDown, Folder, FolderOpen, Pencil, Check, X } from 'lucide-react';
import type { CategoryTreeNode } from '@/lib/types/category';

interface Props {
  node: CategoryTreeNode;
  onDelete: (id: string) => void;
  onEdit?: (id: string, newName: string) => void;
  level: number;
}

export function CategoryTreeNodeView({ node, onDelete, onEdit, level }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const hasChildren = node.children.length > 0;
  const Caret = expanded ? ChevronDown : ChevronRight;
  const FolderIcon = expanded && hasChildren ? FolderOpen : Folder;

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== node.name && onEdit) {
      onEdit(node.id, trimmed);
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(node.name);
    setEditing(false);
  };

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
        {editing ? (
          <>
            <input
              className="flex-1 text-sm font-medium border rounded px-1 py-0.5 bg-background"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              aria-label={`Edit name for category ${node.name}`}
            />
            <button
              onClick={handleSaveEdit}
              className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              aria-label="Save category name"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              aria-label="Cancel edit"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium">{node.name}</span>
            {onEdit && (
              <button
                onClick={() => { setEditValue(node.name); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity cursor-pointer"
                aria-label={`Edit category ${node.name}`}
                title="Edit category"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(node.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
              aria-label={`Delete category ${node.name}`}
              title="Delete category"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNodeView
              key={child.id}
              node={child}
              onDelete={onDelete}
              onEdit={onEdit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
