import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssetTypeService } from '../../application/services/index.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { AssetTypeFullResponseDto } from '../dto/responses/index.js';
import { CreateAssetTypeDto, UpdateAssetTypeDto } from '../dto/index.js';
import { mapAssetTypeToResponse } from './mappers/asset-type.mapper.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';

@ApiTags('Asset Types')
@Controller('api/v1/asset-types')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset types' })
  @ApiResponse({ status: 200, type: [AssetTypeFullResponseDto] })
  @ApiStandardErrors([500])
  async findAll(): Promise<AssetTypeFullResponseDto[]> {
    const assetTypes = await this.assetTypeService.findAll();
    return assetTypes.map(mapAssetTypeToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset type by ID' })
  @ApiResponse({ status: 200, type: AssetTypeFullResponseDto })
  @ApiStandardErrors([404, 500])
  async findById(@Param('id') id: string): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.findById(id);
    return mapAssetTypeToResponse(assetType);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new asset type' })
  @ApiResponse({ status: 201, type: AssetTypeFullResponseDto })
  @ApiStandardErrors([400, 409, 500])
  async create(@Body() dto: CreateAssetTypeDto): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.create({
      code: dto.code,
      label: dto.label,
      group: dto.group,
    });
    return mapAssetTypeToResponse(assetType);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update asset type label and group' })
  @ApiResponse({ status: 200, type: AssetTypeFullResponseDto })
  @ApiStandardErrors([400, 404, 500])
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetTypeDto,
  ): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.update(id, {
      label: dto.label,
      group: dto.group,
    });
    return mapAssetTypeToResponse(assetType);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an asset type (fails with 409 if assets use it)' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 409, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.assetTypeService.delete(id);
  }
}
