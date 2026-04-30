import { Decimal } from 'decimal.js';

export class AssetSnapshot {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly value: Decimal,
    public readonly observedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
