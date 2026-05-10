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
      findUnique: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
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

  describe('findById', () => {
    it('returns entity when found', async () => {
      mockPrismaService.portfolioSnapshot.findUnique.mockResolvedValue(snapshotRow);
      const result = await repository.findById('s1');
      expect(mockPrismaService.portfolioSnapshot.findUnique).toHaveBeenCalledWith({ where: { id: 's1' } });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('s1');
    });

    it('returns null when not found', async () => {
      mockPrismaService.portfolioSnapshot.findUnique.mockResolvedValue(null);
      const result = await repository.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('calls prisma delete', async () => {
      mockPrismaService.portfolioSnapshot.delete.mockResolvedValue(snapshotRow);
      await repository.delete('s1');
      expect(mockPrismaService.portfolioSnapshot.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });
  });

  describe('upsertForDate', () => {
    it('upserts and maps to entity', async () => {
      mockPrismaService.portfolioSnapshot.upsert.mockResolvedValue(snapshotRow);
      const result = await repository.upsertForDate(now, '5000');
      expect(mockPrismaService.portfolioSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { observedAt: now },
          update: expect.objectContaining({ value: expect.any(Decimal) }),
        }),
      );
      expect(result.id).toBe('s1');
    });
  });

  describe('findAllAfter', () => {
    it('returns snapshots after given date', async () => {
      mockPrismaService.portfolioSnapshot.findMany.mockResolvedValue([snapshotRow]);
      const cutoff = new Date('2023-12-31T00:00:00.000Z');
      const result = await repository.findAllAfter(cutoff);
      expect(mockPrismaService.portfolioSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { observedAt: { gt: cutoff } } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('updateValue', () => {
    it('updates value and maps to entity', async () => {
      const updated = { ...snapshotRow, value: new Decimal('9999') };
      mockPrismaService.portfolioSnapshot.update.mockResolvedValue(updated);
      const result = await repository.updateValue('s1', '9999');
      expect(mockPrismaService.portfolioSnapshot.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 's1' } }),
      );
      expect(result.value.toString()).toBe('9999');
    });
  });
});
