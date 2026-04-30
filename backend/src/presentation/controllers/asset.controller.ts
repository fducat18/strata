import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetService } from '../../application/services/index.js';
import { AssetSnapshotService } from '../../application/services/index.js';
import { DomainExceptionFilter } from '../filters/index.js';
import { CreateAssetDto, UpdateAssetDto } from '../dto/index.js';
import { CreateAssetSnapshotDto } from '../dto/index.js';
import { AssetResponseDto } from '../dto/responses/index.js';
import { AssetSnapshotResponseDto } from '../dto/responses/index.js';
import type { Asset } from '../../domain/entities/index.js';
import type { AssetSnapshot } from '../../domain/entities/index.js';

function mapAssetToResponse(asset: Asset): AssetResponseDto {
  const dto = new AssetResponseDto();
  dto.id = asset.id;
  dto.name = asset.name;
  dto.quantity = asset.quantity ? asset.quantity.toString() : null;
  dto.disposed = asset.disposed;
  dto.portfolioId = asset.portfolioId;
  dto.assetTypeId = asset.assetTypeId;
  dto.createdAt = asset.createdAt.toISOString();
  dto.updatedAt = asset.updatedAt.toISOString();
  dto.assetType = asset.assetType
    ? { id: asset.assetType.id, code: asset.assetType.code, label: asset.assetType.label }
    : null;
  dto.portfolio = asset.portfolio
    ? { id: asset.portfolio.id, name: asset.portfolio.name, baseCurrency: asset.portfolio.baseCurrency }
    : null;
  dto.categories = (asset.categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }));
  dto.tags = (asset.tags ?? []).map((t) => ({
    id: t.id,
    name: t.name,
  }));
  return dto;
}

function mapSnapshotToResponse(snapshot: AssetSnapshot): AssetSnapshotResponseDto {
  const dto = new AssetSnapshotResponseDto();
  dto.id = snapshot.id;
  dto.assetId = snapshot.assetId;
  dto.value = snapshot.value.toString();
  dto.observedAt = snapshot.observedAt.toISOString();
  dto.createdAt = snapshot.createdAt.toISOString();
  return dto;
}

@ApiTags('Assets')
@Controller('api/v1/assets')
@UseFilters(DomainExceptionFilter)
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assetSnapshotService: AssetSnapshotService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an asset' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  async create(@Body() dto: CreateAssetDto): Promise<AssetResponseDto> {
    const asset = await this.assetService.create({
      name: dto.name,
      portfolioId: dto.portfolioId,
      assetTypeId: dto.assetTypeId,
      quantity: dto.quantity,
    });
    return mapAssetToResponse(asset);
  }

  @Get()
  @ApiOperation({ summary: 'List all assets' })
  @ApiQuery({ name: 'portfolio_id', required: false })
  @ApiResponse({ status: 200, type: [AssetResponseDto] })
  async findAll(
    @Query('portfolio_id') portfolioId?: string,
  ): Promise<AssetResponseDto[]> {
    const assets = portfolioId
      ? await this.assetService.findByPortfolio(portfolioId)
      : await this.assetService.findAll();
    return assets.map(mapAssetToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  async findById(@Param('id') id: string): Promise<AssetResponseDto> {
    const asset = await this.assetService.findById(id);
    return mapAssetToResponse(asset);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
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
  async delete(@Param('id') id: string): Promise<void> {
    await this.assetService.delete(id);
  }

  @Put(':id/dispose')
  @ApiOperation({ summary: 'Dispose an asset' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  async dispose(@Param('id') id: string): Promise<AssetResponseDto> {
    const asset = await this.assetService.dispose(id);
    return mapAssetToResponse(asset);
  }

  @Get(':id/snapshots')
  @ApiOperation({ summary: 'Get snapshots for an asset' })
  @ApiResponse({ status: 200, type: [AssetSnapshotResponseDto] })
  async getSnapshots(
    @Param('id') id: string,
  ): Promise<AssetSnapshotResponseDto[]> {
    const snapshots = await this.assetSnapshotService.findByAsset(id);
    return snapshots.map(mapSnapshotToResponse);
  }

  @Post(':id/snapshots')
  @ApiOperation({ summary: 'Create a snapshot for an asset' })
  @ApiResponse({ status: 201, type: AssetSnapshotResponseDto })
  async createSnapshot(
    @Param('id') id: string,
    @Body() dto: CreateAssetSnapshotDto,
  ): Promise<AssetSnapshotResponseDto> {
    const snapshot = await this.assetSnapshotService.create({
      assetId: id,
      value: dto.value,
      observedAt: new Date(dto.observedAt),
    });
    return mapSnapshotToResponse(snapshot);
  }

  @Post(':id/tags/:tagId')
  @ApiOperation({ summary: 'Add a tag to an asset' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  async addTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.addTag(id, tagId);
    return mapAssetToResponse(asset);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a tag from an asset' })
  @ApiResponse({ status: 204 })
  async removeTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.assetService.removeTag(id, tagId);
  }

  @Post(':id/categories/:categoryId')
  @ApiOperation({ summary: 'Add a category to an asset' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  async addCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.addCategory(id, categoryId);
    return mapAssetToResponse(asset);
  }

  @Delete(':id/categories/:categoryId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a category from an asset' })
  @ApiResponse({ status: 204 })
  async removeCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ): Promise<void> {
    await this.assetService.removeCategory(id, categoryId);
  }
}
