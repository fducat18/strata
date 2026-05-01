import { Decimal } from 'decimal.js';

// Standalone snapshot of total portfolio value at a point in time.
// "Portfolio" in Strata = everything you own — not linked to a Portfolio table (which no longer exists).
export class PortfolioSnapshot {
  constructor(
    public readonly id: string,
    public readonly value: Decimal,
    public readonly currency: string,
    public readonly notes: string | null,
    public readonly observedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
