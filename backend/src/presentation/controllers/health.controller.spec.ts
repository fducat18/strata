import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get(PrismaService);
  });

  describe('check', () => {
    it('returns status ok with db up when db query succeeds', async () => {
      prismaService.$queryRaw.mockResolvedValue([{ '1': 1 }] as any);
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.db).toBe('up');
      expect(result.version).toBeDefined();
    });

    it('returns status ok with db down when db query fails', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.db).toBe('down');
    });
  });
});
