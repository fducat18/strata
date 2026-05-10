import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import * as path from 'node:path';
import { BackupService, BACKUP_SCHEMA_VERSION } from './backup.service.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));
import * as fsModule from 'node:fs/promises';

describe('BackupService', () => {
  let service: BackupService;
  let prismaService: jest.Mocked<PrismaService>;

  const emptyData = {
    assetTypes: [],
    categories: [],
    tags: [],
    assets: [],
    assetSnapshots: [],
    portfolioSnapshots: [],
    transactions: [],
    categoriesOnAssets: [],
    tagsOnAssets: [],
  };

  const mockPrismaService = {
    assetType: { findMany: jest.fn(), upsert: jest.fn() },
    category: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    tag: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    asset: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    assetSnapshot: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    portfolioSnapshot: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    categoriesOnAssets: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    tagsOnAssets: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    prismaService = module.get(PrismaService);
  });

  describe('exportBackup', () => {
    it('returns a backup payload with correct schema version', async () => {
      for (const prop of Object.values(mockPrismaService)) {
        if (prop && typeof (prop as any).findMany === 'function') {
          (prop as any).findMany.mockResolvedValue([]);
        }
      }
      mockPrismaService.assetType.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.tag.findMany.mockResolvedValue([]);
      mockPrismaService.asset.findMany.mockResolvedValue([]);
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([]);
      mockPrismaService.portfolioSnapshot.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.categoriesOnAssets.findMany.mockResolvedValue([]);
      mockPrismaService.tagsOnAssets.findMany.mockResolvedValue([]);

      const result = await service.exportBackup();

      expect(result.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
      expect(result.exportedAt).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.assetTypes).toEqual([]);
      expect(result.data.assetTypes).toEqual([]);
    });

    it('serializes Decimal values as strings in export', async () => {
      mockPrismaService.assetType.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.tag.findMany.mockResolvedValue([]);
      mockPrismaService.asset.findMany.mockResolvedValue([
        { id: 'a1', quantity: new Decimal('10.5') },
      ]);
      mockPrismaService.assetSnapshot.findMany.mockResolvedValue([]);
      mockPrismaService.portfolioSnapshot.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.categoriesOnAssets.findMany.mockResolvedValue([]);
      mockPrismaService.tagsOnAssets.findMany.mockResolvedValue([]);

      const result = await service.exportBackup();
      expect(typeof result.data.assets[0].quantity).toBe('string');
      expect(result.data.assets[0].quantity).toBe('10.5');
    });
  });

  describe('importBackup', () => {
    it('throws BadRequestException for unsupported schema version', async () => {
      await expect(
        service.importBackup({ schemaVersion: '999', data: emptyData }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls transaction for replace mode', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: emptyData,
        mode: 'replace',
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
      expect(result.mode).toBe('replace');
    });

    it('defaults to replace mode when mode not specified', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: emptyData,
      });

      expect(result.mode).toBe('replace');
    });

    it('handles merge mode (no wipe)', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { upsert: jest.fn() },
          assetSnapshot: { upsert: jest.fn() },
          portfolioSnapshot: { upsert: jest.fn() },
          asset: { upsert: jest.fn() },
          tag: { upsert: jest.fn() },
          category: { upsert: jest.fn() },
          assetType: { upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: emptyData,
        mode: 'merge',
      });

      expect(result.mode).toBe('merge');
    });

    it('inserts categories parents before children', async () => {
      const insertOrder: string[] = [];
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: {
            deleteMany: jest.fn(),
            upsert: jest.fn().mockImplementation(({ create }: any) => {
              insertOrder.push(create.id);
              return Promise.resolve(create);
            }),
          },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const categories = [
        { id: 'c2', name: 'Child', parentId: 'c1' },
        { id: 'c1', name: 'Parent', parentId: null },
      ];

      await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: { ...emptyData, categories },
      });

      expect(insertOrder.indexOf('c1')).toBeLessThan(insertOrder.indexOf('c2'));
    });

    it('returns zero counts for empty data', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: emptyData,
      });

      expect(result.counts.assets).toBe(0);
    });

    it('handles null/undefined data by treating as empty', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: null as any,
      });

      expect(result.counts.assetTypes).toBe(0);
    });

    it('inserts actual data rows via upsertAll', async () => {
      let upsertCalled = false;
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: {
            deleteMany: jest.fn(),
            upsert: jest.fn().mockImplementation(() => {
              upsertCalled = true;
              return Promise.resolve({});
            }),
          },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: {
          ...emptyData,
          tags: [{ id: 't1', name: 'My Tag' }],
        },
      });

      expect(upsertCalled).toBe(true);
      expect(result.counts.tags).toBe(1);
    });

    it('normalizes ISO date strings in rows', async () => {
      let capturedAssetData: any;
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: {
            deleteMany: jest.fn(),
            upsert: jest.fn().mockImplementation(({ create }: any) => {
              capturedAssetData = create;
              return Promise.resolve({});
            }),
          },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: {
          ...emptyData,
          assets: [
            {
              id: 'a1',
              name: 'My Asset',
              assetTypeId: 'at1',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      expect(capturedAssetData.createdAt).toBeInstanceOf(Date);
      expect(capturedAssetData.updatedAt).toBeInstanceOf(Date);
    });

    it('handles existing join table rows (upsertJoin with existing)', async () => {
      mockPrismaService.$transaction.mockImplementation((fn: any) => {
        const txMock = {
          tagsOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest
              .fn()
              .mockResolvedValue({ assetId: 'a1', tagId: 't1' }),
            create: jest.fn(),
          },
          categoriesOnAssets: {
            deleteMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          transaction: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          portfolioSnapshot: { deleteMany: jest.fn(), upsert: jest.fn() },
          asset: { deleteMany: jest.fn(), upsert: jest.fn() },
          tag: { deleteMany: jest.fn(), upsert: jest.fn() },
          category: { deleteMany: jest.fn(), upsert: jest.fn() },
          assetType: { deleteMany: jest.fn(), upsert: jest.fn() },
        };
        return fn(txMock);
      });

      const result = await service.importBackup({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        data: {
          ...emptyData,
          tagsOnAssets: [{ assetId: 'a1', tagId: 't1' }],
        },
      });

      expect(result.counts.tagsOnAssets).toBe(1);
    });
  });

  describe('SQLite file export', () => {
    it('getDbFilePath strips file: prefix and resolves relative path', () => {
      const original = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'file:./dev.db';
      const result = service.getDbFilePath();
      expect(result).toBe(path.resolve(process.cwd(), './dev.db'));
      process.env.DATABASE_URL = original;
    });

    it('getDbFilePath returns absolute path unchanged', () => {
      const original = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'file:/absolute/path/strata.db';
      const result = service.getDbFilePath();
      expect(result).toBe('/absolute/path/strata.db');
      process.env.DATABASE_URL = original;
    });

    it('exportSqliteFile reads the database file and returns a Buffer', async () => {
      const fakeBuffer = Buffer.from('SQLite format 3');
      (fsModule.readFile as jest.Mock).mockResolvedValueOnce(fakeBuffer);
      const result = await service.exportSqliteFile();
      expect(result).toBe(fakeBuffer);
    });
  });
});
