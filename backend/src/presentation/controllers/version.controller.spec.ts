import { Test, TestingModule } from '@nestjs/testing';
import { VersionController } from './version.controller.js';

describe('VersionController', () => {
  let controller: VersionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
    }).compile();

    controller = module.get<VersionController>(VersionController);
  });

  describe('get', () => {
    it('returns version info with required fields', () => {
      const result = controller.get();
      expect(result).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.env).toBeDefined();
      expect(result.gitSha).toBeDefined();
      expect(result.buildTime).toBeDefined();
    });

    it('returns env as development or production', () => {
      const result = controller.get();
      expect(['development', 'production']).toContain(result.env);
    });
  });
});
