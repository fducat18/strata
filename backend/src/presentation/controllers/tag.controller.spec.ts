import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from './tag.controller.js';
import { TagService } from '../../application/services/index.js';
import { Tag } from '../../domain/entities/tag.entity.js';

describe('TagController', () => {
  let controller: TagController;
  let tagService: jest.Mocked<TagService>;

  const sampleTag = new Tag('t1', 'crypto');

  beforeEach(async () => {
    const mockTagService = {
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [{ provide: TagService, useValue: mockTagService }],
    }).compile();

    controller = module.get<TagController>(TagController);
    tagService = module.get(TagService);
  });

  describe('create', () => {
    it('calls tagService.create and returns mapped response', async () => {
      tagService.create.mockResolvedValue(sampleTag);
      const dto = { name: 'crypto' };
      const result = await controller.create(dto as any);
      expect(tagService.create).toHaveBeenCalledWith({ name: 'crypto' });
      expect(result.id).toBe('t1');
      expect(result.name).toBe('crypto');
    });
  });

  describe('update', () => {
    it('calls tagService.update and returns mapped response', async () => {
      const updated = new Tag('t1', 'updated-tag');
      tagService.update.mockResolvedValue(updated);
      const result = await controller.update('t1', { name: 'updated-tag' } as any);
      expect(tagService.update).toHaveBeenCalledWith('t1', 'updated-tag');
      expect(result.id).toBe('t1');
      expect(result.name).toBe('updated-tag');
    });
  });

  describe('findAll', () => {
    it('returns all tags', async () => {
      tagService.findAll.mockResolvedValue([sampleTag]);
      const result = await controller.findAll();
      expect(tagService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns mapped tag', async () => {
      tagService.findById.mockResolvedValue(sampleTag);
      const result = await controller.findById('t1');
      expect(tagService.findById).toHaveBeenCalledWith('t1');
      expect(result.id).toBe('t1');
    });
  });

  describe('delete', () => {
    it('calls tagService.delete', async () => {
      tagService.delete.mockResolvedValue(undefined);
      await controller.delete('t1');
      expect(tagService.delete).toHaveBeenCalledWith('t1');
    });
  });
});
