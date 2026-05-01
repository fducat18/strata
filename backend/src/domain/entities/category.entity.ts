export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly parentId: string | null,
    public readonly parent: Category | null = null,
    public readonly children: Category[] = [],
  ) {}

  getHierarchy(): string[] {
    const names: string[] = [this.name];
    let current: Category | null = this.parent;
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
