import { Tag } from '../entities/tag.entity';

export interface CreateTagData {
  name: string;
}

export interface UpdateTagData {
  name: string;
}

export abstract class ITagRepository {
  abstract save(data: CreateTagData): Promise<Tag>;
  abstract update(id: string, data: UpdateTagData): Promise<Tag>;
  abstract findById(id: string): Promise<Tag | null>;
  abstract findAll(): Promise<Tag[]>;
  abstract delete(id: string): Promise<void>;
}
