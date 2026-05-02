import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
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
