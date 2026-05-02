import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service.js';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/entities/tag.entity.js';
import { TagNotFoundException } from '../../domain/exceptions/domain.exceptions.js';

describe('TagService', () => {
  let service: TagService;

  const mockTagRepo = {
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  };

  const sampleTag = new Tag('t1', 'high-value');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: ITagRepository, useValue: mockTagRepo },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  describe('create', () => {
    it('calls repository.save and returns tag', async () => {
      mockTagRepo.save.mockResolvedValue(sampleTag);
      const result = await service.create({ name: 'high-value' });
      expect(mockTagRepo.save).toHaveBeenCalledWith({ name: 'high-value' });
      expect(result).toBe(sampleTag);
    });
  });

  describe('findById', () => {
    it('returns tag when found', async () => {
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      const result = await service.findById('t1');
      expect(result).toBe(sampleTag);
    });

    it('throws TagNotFoundException when not found', async () => {
      mockTagRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(
        TagNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws TagNotFoundException when not found', async () => {
      mockTagRepo.findById.mockResolvedValue(null);
      await expect(service.update('unknown', 'new-name')).rejects.toThrow(
        TagNotFoundException,
      );
    });

    it('updates and returns the tag', async () => {
      const updated = new Tag('t1', 'new-name');
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockTagRepo.update.mockResolvedValue(updated);
      const result = await service.update('t1', 'new-name');
      expect(mockTagRepo.update).toHaveBeenCalledWith('t1', {
        name: 'new-name',
      });
      expect(result).toBe(updated);
    });
  });

  describe('findAll', () => {
    it('returns all tags', async () => {
      mockTagRepo.findAll.mockResolvedValue([sampleTag]);
      const result = await service.findAll();
      expect(result).toEqual([sampleTag]);
    });
  });

  describe('delete', () => {
    it('throws TagNotFoundException when not found', async () => {
      mockTagRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(
        TagNotFoundException,
      );
    });

    it('calls repository.delete when found', async () => {
      mockTagRepo.findById.mockResolvedValue(sampleTag);
      mockTagRepo.delete.mockResolvedValue(undefined);
      await service.delete('t1');
      expect(mockTagRepo.delete).toHaveBeenCalledWith('t1');
    });
  });
});
