import { Injectable } from '@nestjs/common';
import { Prisma, Tag as TagModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ITagRepository,
  CreateTagData,
  UpdateTagData,
} from '../../domain/ports/tag.repository.port.js';
import { Tag } from '../../domain/entities/tag.entity.js';
import { DuplicateNameException } from '../../domain/exceptions/index.js';

@Injectable()
export class PrismaTagRepository extends ITagRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: TagModel): Tag {
    return new Tag(data.id, data.name);
  }

  async save(data: CreateTagData): Promise<Tag> {
    try {
      const result = await this.prisma.tag.create({
        data: { name: data.name },
      });
      return this.mapToEntity(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateNameException(
          `Tag with name '${data.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateTagData): Promise<Tag> {
    try {
      const result = await this.prisma.tag.update({
        where: { id },
        data: { name: data.name },
      });
      return this.mapToEntity(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateNameException(
          `Tag with name '${data.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Tag | null> {
    const result = await this.prisma.tag.findUnique({
      where: { id },
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<Tag[]> {
    const results = await this.prisma.tag.findMany();
    return results.map((r) => this.mapToEntity(r));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.delete({ where: { id } });
  }
}
