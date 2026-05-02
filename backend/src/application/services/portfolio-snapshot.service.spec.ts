import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { PortfolioSnapshotService } from './portfolio-snapshot.service.js';
import {
  IPortfolioSnapshotRepository,
  IAssetSnapshotRepository,
} from '../../domain/ports/index.js';
import { PortfolioSnapshotNotFoundException } from '../../domain/exceptions/index.js';

const makeSnapshot = (id: string, value: string, currency = 'EUR') => ({
  id,
  value: new Decimal(value),
  currency,
  notes: null,
  observedAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});

const makeAssetSnapshot = (id: string, assetId: string, value: string) => ({
  id,
  assetId,
  value: new Decimal(value),
  observedAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});

describe('PortfolioSnapshotService', () => {
  let service: PortfolioSnapshotService;

  const mockPortfolioSnapshotRepo = {
    save: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const mockAssetSnapshotRepo = {
    save: jest.fn(),
    findByAsset: jest.fn(),
    findLatestByAsset: jest.fn(),
    findLatestPerNonDisposedAsset: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioSnapshotService,
        {
          provide: IPortfolioSnapshotRepository,
          useValue: mockPortfolioSnapshotRepo,
        },
        {
          provide: IAssetSnapshotRepository,
          useValue: mockAssetSnapshotRepo,
        },
      ],
    }).compile();

    service = module.get<PortfolioSnapshotService>(PortfolioSnapshotService);
  });

  describe('computeCurrentValue', () => {
    it('sums values from findLatestPerNonDisposedAsset', async () => {
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([
        makeAssetSnapshot('s1', 'a1', '100000.00'),
        makeAssetSnapshot('s2', 'a2', '-50000.00'),
        makeAssetSnapshot('s3', 'a3', '25000.00'),
      ]);

      const result = await service.computeCurrentValue();
      expect(result.toString()).toBe('75000');
    });

    it('returns 0 when there are no snapshots', async () => {
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([]);

      const result = await service.computeCurrentValue();
      expect(result.toString()).toBe('0');
    });

    it('handles negative-only totals', async () => {
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([
        makeAssetSnapshot('s1', 'a1', '-180000.00'),
      ]);

      const result = await service.computeCurrentValue();
      expect(result.toString()).toBe('-180000');
    });
  });

  describe('create', () => {
    it('auto-computes value when no value provided', async () => {
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([
        makeAssetSnapshot('s1', 'a1', '239200.00'),
      ]);
      const saved = makeSnapshot('ps1', '239200');
      mockPortfolioSnapshotRepo.save.mockResolvedValue(saved);

      const result = await service.create({});

      expect(mockPortfolioSnapshotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ value: '239200', currency: 'EUR' }),
      );
      expect(result).toEqual(saved);
    });

    it('uses explicit value when provided (skips computation)', async () => {
      const saved = makeSnapshot('ps1', '100000');
      mockPortfolioSnapshotRepo.save.mockResolvedValue(saved);

      await service.create({ value: '100000.00', currency: 'USD', notes: 'manual' });

      expect(mockAssetSnapshotRepo.findLatestPerNonDisposedAsset).not.toHaveBeenCalled();
      expect(mockPortfolioSnapshotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ value: '100000.00', currency: 'USD', notes: 'manual' }),
      );
    });

    it('defaults currency to EUR', async () => {
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([]);
      mockPortfolioSnapshotRepo.save.mockResolvedValue(makeSnapshot('ps1', '0'));

      await service.create({});

      expect(mockPortfolioSnapshotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'EUR' }),
      );
    });

    it('uses provided observedAt when given', async () => {
      const observedAt = new Date('2024-06-01T12:00:00.000Z');
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([]);
      mockPortfolioSnapshotRepo.save.mockResolvedValue(makeSnapshot('ps1', '0'));

      await service.create({ observedAt });

      expect(mockPortfolioSnapshotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ observedAt }),
      );
    });
  });

  describe('findAll', () => {
    it('delegates to repository', async () => {
      const snapshots = [makeSnapshot('ps1', '100000'), makeSnapshot('ps2', '200000')];
      mockPortfolioSnapshotRepo.findAll.mockResolvedValue(snapshots);

      const result = await service.findAll();

      expect(result).toEqual(snapshots);
      expect(mockPortfolioSnapshotRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns the snapshot when found', async () => {
      const snapshot = makeSnapshot('ps1', '100000');
      mockPortfolioSnapshotRepo.findById.mockResolvedValue(snapshot);

      const result = await service.findById('ps1');
      expect(result).toEqual(snapshot);
    });

    it('throws PortfolioSnapshotNotFoundException when not found', async () => {
      mockPortfolioSnapshotRepo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        PortfolioSnapshotNotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes an existing snapshot', async () => {
      const snapshot = makeSnapshot('ps1', '100000');
      mockPortfolioSnapshotRepo.findById.mockResolvedValue(snapshot);
      mockPortfolioSnapshotRepo.delete.mockResolvedValue(undefined);

      await service.delete('ps1');

      expect(mockPortfolioSnapshotRepo.delete).toHaveBeenCalledWith('ps1');
    });

    it('throws PortfolioSnapshotNotFoundException when snapshot does not exist', async () => {
      mockPortfolioSnapshotRepo.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        PortfolioSnapshotNotFoundException,
      );
      expect(mockPortfolioSnapshotRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentValue', () => {
    it('returns current value and currency', async () => {
      mockAssetSnapshotRepo.findLatestPerNonDisposedAsset.mockResolvedValue([
        makeAssetSnapshot('s1', 'a1', '239200.00'),
      ]);

      const result = await service.getCurrentValue();
      expect(result).toEqual({ value: '239200', currency: 'EUR' });
    });
  });
});
