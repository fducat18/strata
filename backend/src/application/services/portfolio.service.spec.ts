import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { PortfolioService } from './portfolio.service.js';
import { IPortfolioRepository } from '../../domain/ports/portfolio.repository.port.js';
import { IPortfolioSnapshotRepository } from '../../domain/ports/portfolio-snapshot.repository.port.js';
import { Portfolio } from '../../domain/entities/portfolio.entity.js';
import { PortfolioSnapshot } from '../../domain/entities/portfolio-snapshot.entity.js';
import { PortfolioNotFoundException } from '../../domain/exceptions/domain.exceptions.js';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPortfolioRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSnapshotRepo = {
    save: jest.fn(),
    findByPortfolio: jest.fn(),
  };

  const now = new Date();
  const samplePortfolio = new Portfolio('p1', 'My Portfolio', 'EUR', now, now);
  const sampleSnapshot = new PortfolioSnapshot('s1', 'p1', new Decimal('1000'), now, now);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: IPortfolioRepository, useValue: mockPortfolioRepo },
        { provide: IPortfolioSnapshotRepository, useValue: mockSnapshotRepo },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  describe('create', () => {
    it('calls repository.save and returns portfolio', async () => {
      mockPortfolioRepo.save.mockResolvedValue(samplePortfolio);
      const result = await service.create({ name: 'My Portfolio', baseCurrency: 'EUR' });
      expect(mockPortfolioRepo.save).toHaveBeenCalledWith({ name: 'My Portfolio', baseCurrency: 'EUR' });
      expect(result).toBe(samplePortfolio);
    });
  });

  describe('findById', () => {
    it('returns portfolio when found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      const result = await service.findById('p1');
      expect(result).toBe(samplePortfolio);
    });

    it('throws PortfolioNotFoundException when not found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(PortfolioNotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all portfolios', async () => {
      mockPortfolioRepo.findAll.mockResolvedValue([samplePortfolio]);
      const result = await service.findAll();
      expect(result).toEqual([samplePortfolio]);
    });
  });

  describe('update', () => {
    it('throws PortfolioNotFoundException when not found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(service.update('unknown', { name: 'New' })).rejects.toThrow(PortfolioNotFoundException);
    });

    it('calls repository.update when found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockPortfolioRepo.update.mockResolvedValue(samplePortfolio);
      await service.update('p1', { name: 'Updated' });
      expect(mockPortfolioRepo.update).toHaveBeenCalledWith('p1', { name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('throws PortfolioNotFoundException when not found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(PortfolioNotFoundException);
    });

    it('calls repository.delete when found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockPortfolioRepo.delete.mockResolvedValue(undefined);
      await service.delete('p1');
      expect(mockPortfolioRepo.delete).toHaveBeenCalledWith('p1');
    });
  });

  describe('takeSnapshot', () => {
    it('throws PortfolioNotFoundException when not found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(service.takeSnapshot('unknown')).rejects.toThrow(PortfolioNotFoundException);
    });

    it('saves snapshot with portfolio totalValue', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockSnapshotRepo.save.mockResolvedValue(sampleSnapshot);
      const result = await service.takeSnapshot('p1');
      expect(mockSnapshotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          portfolioId: 'p1',
          value: '0',
        }),
      );
      expect(result).toBe(sampleSnapshot);
    });
  });

  describe('getSnapshots', () => {
    it('throws PortfolioNotFoundException when not found', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(null);
      await expect(service.getSnapshots('unknown')).rejects.toThrow(PortfolioNotFoundException);
    });

    it('returns snapshots for existing portfolio', async () => {
      mockPortfolioRepo.findById.mockResolvedValue(samplePortfolio);
      mockSnapshotRepo.findByPortfolio.mockResolvedValue([sampleSnapshot]);
      const result = await service.getSnapshots('p1');
      expect(result).toEqual([sampleSnapshot]);
    });
  });
});
