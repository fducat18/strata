import { Category } from './category.entity.js';

describe('Category', () => {
  describe('isRoot()', () => {
    it('returns true when parentId is null', () => {
      const category = new Category('c1', 'Root', null);
      expect(category.isRoot()).toBe(true);
    });

    it('returns false when parentId is set', () => {
      const category = new Category('c2', 'Child', 'c1');
      expect(category.isRoot()).toBe(false);
    });
  });

  describe('getHierarchy()', () => {
    it('returns array with single name for root category', () => {
      const root = new Category('c1', 'Root', null);
      expect(root.getHierarchy()).toEqual(['Root']);
    });

    it('returns array of names from root to current', () => {
      const root = new Category('c1', 'Financial', null);
      const mid = new Category('c2', 'Banking', 'c1', root);
      const leaf = new Category('c3', 'Savings', 'c2', mid);
      expect(leaf.getHierarchy()).toEqual(['Financial', 'Banking', 'Savings']);
    });

    it('returns two-level hierarchy', () => {
      const parent = new Category('c1', 'Real Estate', null);
      const child = new Category('c2', 'Residential', 'c1', parent);
      expect(child.getHierarchy()).toEqual(['Real Estate', 'Residential']);
    });
  });
});
