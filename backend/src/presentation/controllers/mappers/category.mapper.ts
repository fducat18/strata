import { CategoryResponseDto } from '../../dto/responses/index.js';
import type { Category } from '../../../domain/entities/index.js';

export function mapCategoryToResponse(category: Category): CategoryResponseDto {
  const dto = new CategoryResponseDto();
  dto.id = category.id;
  dto.name = category.name;
  dto.parentId = category.parentId;
  dto.children = (category.children ?? []).map(mapCategoryToResponse);
  return dto;
}
