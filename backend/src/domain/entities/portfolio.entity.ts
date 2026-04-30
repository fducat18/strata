import { Decimal } from 'decimal.js';
import { Asset } from './asset.entity';
import { PortfolioSnapshot } from './portfolio-snapshot.entity';

export class Portfolio {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly baseCurrency: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly assets: Asset[] = [],
    public readonly snapshots: PortfolioSnapshot[] = [],
  ) {}

  totalValue(): Decimal {
    return this.assets.reduce((sum, asset) => {
      const val = asset.currentValue();
      return val ? sum.plus(val) : sum;
    }, new Decimal(0));
  }
}
