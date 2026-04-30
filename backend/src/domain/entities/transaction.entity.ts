import { Decimal } from 'decimal.js';

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly type: 'ACQUIRE' | 'DISPOSE' | 'ADJUST',
    public readonly unitPrice: Decimal,
    public readonly quantity: Decimal,
    public readonly currency: string,
    public readonly occurredAt: Date,
    public readonly createdAt: Date,
  ) {}
}
