import { describe, it, expect } from 'vitest';
import { buildCategoryTree } from '../category';

describe('buildCategoryTree', () => {
  it('returns roots with nested children', () => {
    const flat = [
      { id: 'a', name: 'A', parentId: null },
      { id: 'b', name: 'B', parentId: 'a' },
      { id: 'c', name: 'C', parentId: 'b' },
      { id: 'd', name: 'D', parentId: null },
    ];
    const tree = buildCategoryTree(flat);
    expect(tree).toHaveLength(2);
    const a = tree.find((n) => n.id === 'a')!;
    expect(a.children).toHaveLength(1);
    expect(a.children[0].id).toBe('b');
    expect(a.children[0].children[0].id).toBe('c');
  });
});
