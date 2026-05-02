import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TagService } from '../../application/services/index.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { CreateTagDto, UpdateTagDto } from '../dto/index.js';
import { TagResponseDto } from '../dto/responses/index.js';
import { mapTagToResponse } from './mappers/tag.mapper.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';

@ApiTags('Tags')
@Controller('api/v1/tags')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @ApiResponse({ status: 201, type: TagResponseDto })
  @ApiStandardErrors([400, 409, 500])
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagService.create({ name: dto.name });
    return mapTagToResponse(tag);
  }

  @Get()
  @ApiOperation({ summary: 'List all tags' })
  @ApiResponse({ status: 200, type: [TagResponseDto] })
  @ApiStandardErrors([500])
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagService.findAll();
    return tags.map(mapTagToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiResponse({ status: 200, type: TagResponseDto })
  @ApiStandardErrors([404, 500])
  async findById(@Param('id') id: string): Promise<TagResponseDto> {
    const tag = await this.tagService.findById(id);
    return mapTagToResponse(tag);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Rename a tag' })
  @ApiResponse({ status: 200, type: TagResponseDto })
  @ApiStandardErrors([400, 404, 409, 500])
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const tag = await this.tagService.update(id, dto.name);
    return mapTagToResponse(tag);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.tagService.delete(id);
  }
}
