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
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { CreateCategoryDto } from '../dto/index.js';
import { CategoryResponseDto } from '../dto/responses/index.js';
import { mapCategoryToResponse } from './mappers/category.mapper.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';

@ApiTags('Categories')
@Controller('api/v1/categories')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiStandardErrors([400, 404, 409, 500])
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
  @ApiStandardErrors([500])
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return categories.map(mapCategoryToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiStandardErrors([404, 500])
  async findById(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findById(id);
    return mapCategoryToResponse(category);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 409, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.categoryService.delete(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get children of a category' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  @ApiStandardErrors([404, 500])
  async findChildren(@Param('id') id: string): Promise<CategoryResponseDto[]> {
    const children = await this.categoryService.findChildren(id);
    return children.map(mapCategoryToResponse);
  }
}
