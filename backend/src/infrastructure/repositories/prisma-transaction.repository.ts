import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ITransactionRepository,
  CreateTransactionData,
} from '../../domain/ports/transaction.repository.port.js';
import { Transaction } from '../../domain/entities/transaction.entity.js';

@Injectable()
export class PrismaTransactionRepository extends ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(data: CreateTransactionData): Promise<Transaction> {
    const result = await this.prisma.transaction.create({
      data: {
        assetId: data.assetId,
        type: data.type,
        unitPrice: new Decimal(data.unitPrice),
        quantity: new Decimal(data.quantity),
        currency: data.currency,
        occurredAt: data.occurredAt,
      },
    });
    return this.mapToEntity(result);
  }

  async findByAssetAndType(assetId: string, type: string): Promise<Transaction | null> {
    const result = await this.prisma.transaction.findFirst({
      where: { assetId, type: type as TransactionType },
    });
    return result ? this.mapToEntity(result) : null;
  }

  private mapToEntity(result: {
    id: string;
    assetId: string;
    type: TransactionType;
    unitPrice: { toString(): string };
    quantity: { toString(): string };
    currency: string;
    occurredAt: Date;
    createdAt: Date;
  }): Transaction {
    return new Transaction(
      result.id,
      result.assetId,
      result.type,
      new Decimal(result.unitPrice.toString()),
      new Decimal(result.quantity.toString()),
      result.currency,
      result.occurredAt,
      result.createdAt,
    );
  }
}
