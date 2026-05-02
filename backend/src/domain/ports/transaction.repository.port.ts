import { Transaction } from '../entities/transaction.entity.js';

export interface CreateTransactionData {
  assetId: string;
  type: 'ACQUIRE' | 'DISPOSE' | 'ADJUST';
  unitPrice: string;
  quantity: string;
  currency: string;
  occurredAt: Date;
}

export abstract class ITransactionRepository {
  abstract save(data: CreateTransactionData): Promise<Transaction>;
  abstract findByAssetAndType(assetId: string, type: string): Promise<Transaction | null>;
  abstract updateOccurredAt(id: string, occurredAt: Date): Promise<Transaction>;
}
