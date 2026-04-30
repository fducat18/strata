import { Decimal } from 'decimal.js';
import { AssetType } from './asset-type.entity';
import { AssetSnapshot } from './asset-snapshot.entity';
import { Transaction } from './transaction.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Portfolio } from './portfolio.entity';

export class Asset {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly quantity: Decimal | null,
    public readonly disposed: boolean,
    public readonly portfolioId: string,
    public readonly assetTypeId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly assetType: AssetType | null = null,
    public readonly portfolio: Portfolio | null = null,
    public readonly snapshots: AssetSnapshot[] = [],
    public readonly transactions: Transaction[] = [],
    public readonly categories: Category[] = [],
    public readonly tags: Tag[] = [],
  ) {}

  currentValue(): Decimal | null {
    if (this.snapshots.length === 0) return null;

    const sorted = [...this.snapshots].sort(
      (a, b) => b.observedAt.getTime() - a.observedAt.getTime(),
    );
    return sorted[0].value;
  }

  dispose(): Asset {
    return new Asset(
      this.id,
      this.name,
      this.quantity,
      true,
      this.portfolioId,
      this.assetTypeId,
      this.createdAt,
      this.updatedAt,
      this.assetType,
      this.portfolio,
      this.snapshots,
      this.transactions,
      this.categories,
      this.tags,
    );
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}
