import { TagResponseDto } from '../../dto/responses/index.js';
import type { Tag } from '../../../domain/entities/index.js';

export function mapTagToResponse(tag: Tag): TagResponseDto {
  const dto = new TagResponseDto();
  dto.id = tag.id;
  dto.name = tag.name;
  return dto;
}
