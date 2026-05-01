import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { PrismaPortfolioSnapshotRepository } from './prisma-portfolio-snapshot.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PrismaPortfolioSnapshotRepository', () => {
  let repository: PrismaPortfolioSnapshotRepository;

  const now = new Date('2024-01-01T00:00:00.000Z');
  const snapshotRow = {
    id: 's1',
    value: new Decimal('5000'),
    currency: 'EUR',
    notes: null,
    observedAt: now,
    createdAt: now,
  };

  const mockPrismaService = {
    portfolioSnapshot: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaPortfolioSnapshotRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaPortfolioSnapshotRepository>(
      PrismaPortfolioSnapshotRepository,
    );
  });

  describe('save', () => {
    it('creates snapshot and maps to entity', async () => {
      mockPrismaService.portfolioSnapshot.create.mockResolvedValue(snapshotRow);
      const data = { value: '5000', observedAt: now };
      const result = await repository.save(data);
      expect(mockPrismaService.portfolioSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            value: expect.any(Decimal),
            observedAt: now,
          }),
        }),
      );
      expect(result.id).toBe('s1');
      expect(result.value).toBeInstanceOf(Decimal);
      expect(result.value.toString()).toBe('5000');
    });
  });

  describe('findAll', () => {
    it('returns snapshots ordered by observedAt desc', async () => {
      mockPrismaService.portfolioSnapshot.findMany.mockResolvedValue([
        snapshotRow,
      ]);
      const result = await repository.findAll();
      expect(mockPrismaService.portfolioSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { observedAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('returns empty array when no snapshots', async () => {
      mockPrismaService.portfolioSnapshot.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });
});
