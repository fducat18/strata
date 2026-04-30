export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly parentId: string | null,
    public readonly parent: Category | null = null,
    public readonly children: Category[] = [],
  ) {}

  getHierarchy(): string[] {
    const names: string[] = [];
    let current: Category | null = this;
    while (current) {
      names.unshift(current.name);
      current = current.parent;
    }
    return names;
  }

  isRoot(): boolean {
    return this.parentId === null;
  }
}
