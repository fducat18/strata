import { Decimal } from 'decimal.js';

export class PortfolioSnapshot {
  constructor(
    public readonly id: string,
    public readonly portfolioId: string,
    public readonly value: Decimal,
    public readonly observedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
