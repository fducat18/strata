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
import { TagService } from '../../application/services/index.js';
import { DomainExceptionFilter } from '../filters/index.js';
import { CreateTagDto } from '../dto/index.js';
import { TagResponseDto } from '../dto/responses/index.js';
import type { Tag } from '../../domain/entities/index.js';

function mapTagToResponse(tag: Tag): TagResponseDto {
  const dto = new TagResponseDto();
  dto.id = tag.id;
  dto.name = tag.name;
  return dto;
}

@ApiTags('Tags')
@Controller('api/v1/tags')
@UseFilters(DomainExceptionFilter)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @ApiResponse({ status: 201, type: TagResponseDto })
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagService.create({ name: dto.name });
    return mapTagToResponse(tag);
  }

  @Get()
  @ApiOperation({ summary: 'List all tags' })
  @ApiResponse({ status: 200, type: [TagResponseDto] })
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagService.findAll();
    return tags.map(mapTagToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiResponse({ status: 200, type: TagResponseDto })
  async findById(@Param('id') id: string): Promise<TagResponseDto> {
    const tag = await this.tagService.findById(id);
    return mapTagToResponse(tag);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.tagService.delete(id);
  }
}
