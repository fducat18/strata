import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller.js';
import { BackupService } from '../../application/services/backup/index.js';
import type {
  BackupPayload,
  RestoreCounts,
} from '../../application/services/backup/index.js';

describe('AdminController', () => {
  let controller: AdminController;
  let backupService: jest.Mocked<BackupService>;

  const sampleBackupPayload: BackupPayload = {
    schemaVersion: '1',
    exportedAt: '2024-01-01T00:00:00.000Z',
    data: {
      assetTypes: [],
      categories: [],
      tags: [],
      assets: [],
      assetSnapshots: [],
      portfolioSnapshots: [],
      transactions: [],
      categoriesOnAssets: [],
      tagsOnAssets: [],
    },
  };

  const sampleRestoreCounts: RestoreCounts = {
    schemaVersion: '1',
    mode: 'replace',
    counts: {
      assetTypes: 0,
      categories: 0,
      tags: 0,
      assets: 3,
      assetSnapshots: 5,
      portfolioSnapshots: 0,
      transactions: 0,
      categoriesOnAssets: 0,
      tagsOnAssets: 0,
    },
  };

  beforeEach(async () => {
    const mockBackupService = {
      exportBackup: jest.fn(),
      importBackup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: BackupService, useValue: mockBackupService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    backupService = module.get(BackupService);
  });

  describe('exportBackup', () => {
    it('calls backupService.exportBackup and returns payload', async () => {
      backupService.exportBackup.mockResolvedValue(sampleBackupPayload);
      const result = await controller.exportBackup();
      expect(backupService.exportBackup).toHaveBeenCalled();
      expect(result.schemaVersion).toBe('1');
      expect(result.data).toBeDefined();
    });
  });

  describe('restoreBackup', () => {
    it('calls backupService.importBackup with dto fields and returns counts', async () => {
      backupService.importBackup.mockResolvedValue(sampleRestoreCounts);
      const dto = {
        schemaVersion: '1',
        data: sampleBackupPayload.data,
        mode: 'replace' as const,
      };
      const result = await controller.restoreBackup(dto as any);
      expect(backupService.importBackup).toHaveBeenCalledWith({
        schemaVersion: '1',
        data: sampleBackupPayload.data,
        mode: 'replace',
      });
      expect(result.schemaVersion).toBe('1');
      expect(result.mode).toBe('replace');
    });

    it('passes undefined mode when not provided in dto', async () => {
      backupService.importBackup.mockResolvedValue(sampleRestoreCounts);
      const dto = {
        schemaVersion: '1',
        data: sampleBackupPayload.data,
        mode: undefined,
      };
      await controller.restoreBackup(dto as any);
      expect(backupService.importBackup).toHaveBeenCalledWith({
        schemaVersion: '1',
        data: sampleBackupPayload.data,
        mode: undefined,
      });
    });
  });
});
