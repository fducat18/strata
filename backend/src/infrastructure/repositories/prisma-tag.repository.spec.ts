import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaTagRepository } from './prisma-tag.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DuplicateNameException } from '../../domain/exceptions/index.js';

describe('PrismaTagRepository', () => {
  let repository: PrismaTagRepository;

  const tagRow = { id: 't1', name: 'crypto' };

  const mockPrismaService = {
    tag: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaTagRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaTagRepository>(PrismaTagRepository);
  });

  describe('save', () => {
    it('creates tag and maps to entity', async () => {
      mockPrismaService.tag.create.mockResolvedValue(tagRow);
      const result = await repository.save({ name: 'crypto' });
      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: { name: 'crypto' },
      });
      expect(result.id).toBe('t1');
      expect(result.name).toBe('crypto');
    });

    it('throws DuplicateNameException on P2002 error', async () => {
      mockPrismaService.tag.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );
      await expect(repository.save({ name: 'Duplicate' })).rejects.toThrow(
        DuplicateNameException,
      );
    });

    it('re-throws non-P2002 Prisma errors', async () => {
      mockPrismaService.tag.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('other', {
          code: 'P2003',
          clientVersion: '5.0.0',
        }),
      );
      await expect(repository.save({ name: 'Fail' })).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  describe('findById', () => {
    it('returns mapped tag when found', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(tagRow);
      const result = await repository.findById('t1');
      expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
      expect(result?.id).toBe('t1');
      expect(result?.name).toBe('crypto');
    });

    it('returns null when not found', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all tags', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([
        tagRow,
        { id: 't2', name: 'defi' },
      ]);
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('crypto');
    });

    it('returns empty array when none found', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('calls prisma.tag.delete', async () => {
      mockPrismaService.tag.delete.mockResolvedValue(undefined);
      await repository.delete('t1');
      expect(mockPrismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
    });
  });

  describe('update', () => {
    it('updates tag name and returns entity', async () => {
      const updated = { id: 't1', name: 'defi' };
      mockPrismaService.tag.update.mockResolvedValue(updated);
      const result = await repository.update('t1', { name: 'defi' });
      expect(mockPrismaService.tag.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { name: 'defi' },
      });
      expect(result.name).toBe('defi');
    });

    it('throws DuplicateNameException on P2002', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      mockPrismaService.tag.update.mockRejectedValue(prismaError);
      await expect(repository.update('t1', { name: 'existing' })).rejects.toThrow(
        DuplicateNameException,
      );
    });

    it('rethrows unknown errors', async () => {
      const unknownError = new Error('DB down');
      mockPrismaService.tag.update.mockRejectedValue(unknownError);
      await expect(repository.update('t1', { name: 'x' })).rejects.toThrow('DB down');
    });
  });
});
