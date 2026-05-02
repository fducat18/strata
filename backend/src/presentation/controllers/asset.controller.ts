import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AssetService,
  AssetSnapshotService,
} from '../../application/services/index.js';
import {
  CreateAssetDto,
  CreateAssetSnapshotDto,
  UpdateAssetDto,
  DisposeAssetDto,
} from '../dto/index.js';
import {
  AssetResponseDto,
  AssetSnapshotResponseDto,
} from '../dto/responses/index.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import {
  mapAssetToResponse,
  mapAssetSnapshotToResponse,
} from './mappers/asset.mapper.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';

@ApiTags('Assets')
@Controller('api/v1/assets')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assetSnapshotService: AssetSnapshotService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an asset' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  @ApiStandardErrors([400, 404, 409, 500])
  async create(@Body() dto: CreateAssetDto): Promise<AssetResponseDto> {
    const asset = await this.assetService.create({
      name: dto.name,
      assetTypeId: dto.assetTypeId,
      quantity: dto.quantity,
      acquisitionDate: dto.acquisitionDate,
      acquisitionPrice: dto.acquisitionPrice,
    });
    return mapAssetToResponse(asset);
  }

  @Get()
  @ApiOperation({ summary: 'List all assets' })
  @ApiResponse({ status: 200, type: [AssetResponseDto] })
  @ApiStandardErrors([500])
  async findAll(): Promise<AssetResponseDto[]> {
    const assets = await this.assetService.findAll();
    return assets.map(mapAssetToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  @ApiStandardErrors([404, 500])
  async findById(@Param('id') id: string): Promise<AssetResponseDto> {
    const asset = await this.assetService.findById(id);
    return mapAssetToResponse(asset);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  @ApiStandardErrors([400, 404, 500])
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.update(id, {
      name: dto.name,
      quantity: dto.quantity,
      assetTypeId: dto.assetTypeId,
    });
    return mapAssetToResponse(asset);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.assetService.delete(id);
  }

  @Patch(':id/dispose')
  @ApiOperation({ summary: 'Mark an asset as disposed' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  @ApiStandardErrors([400, 404, 409, 500])
  async dispose(
    @Param('id') id: string,
    @Body() dto: DisposeAssetDto,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.dispose(id, dto.disposalDate, dto.disposalPrice);
    return mapAssetToResponse(asset);
  }

  @Get(':id/snapshots')
  @ApiOperation({ summary: 'Get snapshots for an asset' })
  @ApiResponse({ status: 200, type: [AssetSnapshotResponseDto] })
  @ApiStandardErrors([404, 500])
  async getSnapshots(
    @Param('id') id: string,
  ): Promise<AssetSnapshotResponseDto[]> {
    const snapshots = await this.assetSnapshotService.findByAsset(id);
    return snapshots.map(mapAssetSnapshotToResponse);
  }

  @Post(':id/snapshots')
  @ApiOperation({ summary: 'Create a snapshot for an asset' })
  @ApiResponse({ status: 201, type: AssetSnapshotResponseDto })
  @ApiStandardErrors([400, 404, 500])
  async createSnapshot(
    @Param('id') id: string,
    @Body() dto: CreateAssetSnapshotDto,
  ): Promise<AssetSnapshotResponseDto> {
    const date = new Date(dto.observedAt);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date: observedAt');
    }
    const snapshot = await this.assetSnapshotService.create({
      assetId: id,
      value: dto.value,
      observedAt: date,
    });
    return mapAssetSnapshotToResponse(snapshot);
  }

  @Post(':id/tags/:tagId')
  @ApiOperation({ summary: 'Attach a tag to an asset' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  @ApiStandardErrors([404, 409, 500])
  async addTagToAsset(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.addTag(id, tagId);
    return mapAssetToResponse(asset);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Detach a tag from an asset' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 500])
  async removeTagFromAsset(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.assetService.removeTag(id, tagId);
  }

  @Post(':id/categories/:categoryId')
  @ApiOperation({ summary: 'Attach a category to an asset' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  @ApiStandardErrors([404, 409, 500])
  async addCategoryToAsset(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.addCategory(id, categoryId);
    return mapAssetToResponse(asset);
  }

  @Delete(':id/categories/:categoryId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Detach a category from an asset' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 500])
  async removeCategoryFromAsset(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ): Promise<void> {
    await this.assetService.removeCategory(id, categoryId);
  }
}
