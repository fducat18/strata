import { Injectable } from '@nestjs/common';
import { Tag } from '../../domain/entities/index.js';
import { ITagRepository, type CreateTagData } from '../../domain/ports/index.js';
import { TagNotFoundException } from '../../domain/exceptions/index.js';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: ITagRepository) {}

  async create(data: CreateTagData): Promise<Tag> {
    return this.tagRepository.save(data);
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) throw new TagNotFoundException(`Tag ${id} not found`);
    return tag;
  }

  async findAll(): Promise<Tag[]> {
    return this.tagRepository.findAll();
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.tagRepository.delete(id);
  }
}
