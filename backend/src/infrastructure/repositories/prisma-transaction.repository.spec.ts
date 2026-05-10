import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PrismaTransactionRepository } from './prisma-transaction.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PrismaTransactionRepository', () => {
  let repository: PrismaTransactionRepository;

  const now = new Date('2024-01-01T00:00:00.000Z');
  const txRow = {
    id: 'tx1',
    assetId: 'a1',
    type: TransactionType.ACQUIRE,
    unitPrice: new Decimal('100.00'),
    quantity: new Decimal('10.00000000'),
    currency: 'EUR',
    occurredAt: now,
    createdAt: now,
  };

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaTransactionRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaTransactionRepository>(PrismaTransactionRepository);
  });

  describe('save', () => {
    it('creates transaction and maps to entity', async () => {
      mockPrismaService.transaction.create.mockResolvedValue(txRow);
      const data = {
        assetId: 'a1',
        type: TransactionType.ACQUIRE,
        unitPrice: '100.00',
        quantity: '10.00000000',
        currency: 'EUR',
        occurredAt: now,
      };
      const result = await repository.save(data);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assetId: 'a1',
            type: TransactionType.ACQUIRE,
            currency: 'EUR',
            occurredAt: now,
          }),
        }),
      );
      expect(result.id).toBe('tx1');
      expect(result.assetId).toBe('a1');
      expect(result.type).toBe(TransactionType.ACQUIRE);
      expect(result.unitPrice).toBeInstanceOf(Decimal);
      expect(result.unitPrice.toString()).toBe('100');
      expect(result.quantity.toString()).toBe('10');
      expect(result.currency).toBe('EUR');
      expect(result.occurredAt).toBe(now);
    });

    it('saves DISPOSE transaction', async () => {
      const disposeRow = { ...txRow, id: 'tx2', type: TransactionType.DISPOSE };
      mockPrismaService.transaction.create.mockResolvedValue(disposeRow);
      const data = {
        assetId: 'a1',
        type: TransactionType.DISPOSE,
        unitPrice: '110.00',
        quantity: '10.00000000',
        currency: 'EUR',
        occurredAt: now,
      };
      const result = await repository.save(data);
      expect(result.type).toBe(TransactionType.DISPOSE);
    });
  });

  describe('findByAssetAndType', () => {
    it('returns entity when found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(txRow);
      const result = await repository.findByAssetAndType('a1', 'ACQUIRE');
      expect(mockPrismaService.transaction.findFirst).toHaveBeenCalledWith({
        where: { assetId: 'a1', type: 'ACQUIRE' },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('tx1');
    });

    it('returns null when not found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);
      const result = await repository.findByAssetAndType('a1', 'DISPOSE');
      expect(result).toBeNull();
    });
  });

  describe('updateOccurredAt', () => {
    it('updates and returns mapped entity', async () => {
      const newDate = new Date('2024-06-01T00:00:00.000Z');
      const updated = { ...txRow, occurredAt: newDate };
      mockPrismaService.transaction.update.mockResolvedValue(updated);
      const result = await repository.updateOccurredAt('tx1', newDate);
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: { occurredAt: newDate },
      });
      expect(result.occurredAt).toBe(newDate);
      expect(result.id).toBe('tx1');
    });
  });
});
