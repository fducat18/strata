import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioSnapshotController } from './portfolio-snapshot.controller.js';
import { PortfolioSnapshotService } from '../../application/services/portfolio-snapshot.service.js';
import { PortfolioSnapshot } from '../../domain/entities/portfolio-snapshot.entity.js';
import { Decimal } from 'decimal.js';

describe('PortfolioSnapshotController', () => {
  let controller: PortfolioSnapshotController;
  let service: jest.Mocked<PortfolioSnapshotService>;

  const now = new Date('2025-01-15T12:00:00.000Z');
  const created = new Date('2025-01-15T12:01:00.000Z');

  const makeSnapshot = (id: string, value = '10000.00') =>
    new PortfolioSnapshot(id, new Decimal(value), 'EUR', null, now, created);

  const snap1 = makeSnapshot('ps1', '10000.00');
  const snap2 = makeSnapshot('ps2', '12000.50');

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      getCurrentValue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioSnapshotController],
      providers: [
        { provide: PortfolioSnapshotService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<PortfolioSnapshotController>(PortfolioSnapshotController);
    service = module.get(PortfolioSnapshotService);
  });

  describe('findAll', () => {
    it('returns all snapshots mapped to response DTOs', async () => {
      service.findAll.mockResolvedValue([snap1, snap2]);
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ps1');
      expect(result[0].value).toBe('10000');
      expect(result[0].currency).toBe('EUR');
      expect(result[1].id).toBe('ps2');
    });

    it('returns empty array when no snapshots', async () => {
      service.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('getCurrentValue', () => {
    it('returns current net worth from service', async () => {
      service.getCurrentValue.mockResolvedValue({ value: '25000.00', currency: 'EUR' });
      const result = await controller.getCurrentValue();
      expect(service.getCurrentValue).toHaveBeenCalled();
      expect(result.value).toBe('25000.00');
      expect(result.currency).toBe('EUR');
    });
  });

  describe('findById', () => {
    it('returns snapshot mapped to response DTO', async () => {
      service.findById.mockResolvedValue(snap1);
      const result = await controller.findById('ps1');
      expect(service.findById).toHaveBeenCalledWith('ps1');
      expect(result.id).toBe('ps1');
      expect(result.value).toBe('10000');
    });
  });

  describe('create', () => {
    it('creates snapshot with all fields', async () => {
      service.create.mockResolvedValue(snap1);
      const result = await controller.create({
        value: '10000.00',
        currency: 'EUR',
        notes: 'Year end',
        observedAt: '2025-01-15T12:00:00.000Z',
      });
      expect(service.create).toHaveBeenCalledWith({
        value: '10000.00',
        currency: 'EUR',
        notes: 'Year end',
        observedAt: new Date('2025-01-15T12:00:00.000Z'),
      });
      expect(result.id).toBe('ps1');
    });

    it('creates snapshot without optional fields', async () => {
      service.create.mockResolvedValue(snap1);
      await controller.create({ currency: 'EUR' });
      expect(service.create).toHaveBeenCalledWith({
        value: undefined,
        currency: 'EUR',
        notes: undefined,
        observedAt: undefined,
      });
    });
  });

  describe('delete', () => {
    it('calls service delete with id', async () => {
      service.delete.mockResolvedValue(undefined);
      await controller.delete('ps1');
      expect(service.delete).toHaveBeenCalledWith('ps1');
    });
  });

  describe('response mapping', () => {
    it('maps snapshot with notes', async () => {
      const withNotes = new PortfolioSnapshot('ps3', new Decimal('5000'), 'USD', 'Q1 review', now, created);
      service.findById.mockResolvedValue(withNotes);
      const result = await controller.findById('ps3');
      expect(result.notes).toBe('Q1 review');
      expect(result.currency).toBe('USD');
      expect(result.observedAt).toBe(now.toISOString());
      expect(result.createdAt).toBe(created.toISOString());
    });

    it('maps snapshot with null notes', async () => {
      service.findById.mockResolvedValue(snap1);
      const result = await controller.findById('ps1');
      expect(result.notes).toBeNull();
    });
  });
});
