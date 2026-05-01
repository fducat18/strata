import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssetTypeService } from '../../application/services/index.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { AssetTypeFullResponseDto } from '../dto/responses/index.js';
import { mapAssetTypeToResponse } from './mappers/asset-type.mapper.js';

@ApiTags('Asset Types')
@Controller('api/v1/asset-types')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset types' })
  @ApiResponse({ status: 200, type: [AssetTypeFullResponseDto] })
  async findAll(): Promise<AssetTypeFullResponseDto[]> {
    const assetTypes = await this.assetTypeService.findAll();
    return assetTypes.map(mapAssetTypeToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset type by ID' })
  @ApiResponse({ status: 200, type: AssetTypeFullResponseDto })
  async findById(@Param('id') id: string): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.findById(id);
    return mapAssetTypeToResponse(assetType);
  }
}
