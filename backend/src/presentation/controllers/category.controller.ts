import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from '../../application/services/index.js';
import { DomainExceptionFilter } from '../filters/index.js';
import { CreateCategoryDto } from '../dto/index.js';
import { CategoryResponseDto } from '../dto/responses/index.js';
import type { Category } from '../../domain/entities/index.js';

function mapCategoryToResponse(category: Category): CategoryResponseDto {
  const dto = new CategoryResponseDto();
  dto.id = category.id;
  dto.name = category.name;
  dto.parentId = category.parentId;
  dto.children = (category.children ?? []).map(mapCategoryToResponse);
  return dto;
}

@ApiTags('Categories')
@Controller('api/v1/categories')
@UseFilters(DomainExceptionFilter)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create({
      name: dto.name,
      parentId: dto.parentId,
    });
    return mapCategoryToResponse(category);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return categories.map(mapCategoryToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  async findById(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findById(id);
    return mapCategoryToResponse(category);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.categoryService.delete(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get children of a category' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  async findChildren(@Param('id') id: string): Promise<CategoryResponseDto[]> {
    const children = await this.categoryService.findChildren(id);
    return children.map(mapCategoryToResponse);
  }
}
