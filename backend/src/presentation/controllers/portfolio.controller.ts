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
import { PortfolioService } from '../../application/services/index.js';
import { DomainExceptionFilter } from '../filters/index.js';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../dto/index.js';
import { PortfolioResponseDto } from '../dto/responses/index.js';
import { PortfolioSnapshotResponseDto } from '../dto/responses/index.js';
import type { Portfolio, PortfolioSnapshot } from '../../domain/entities/index.js';

function mapPortfolioToResponse(portfolio: Portfolio): PortfolioResponseDto {
  const dto = new PortfolioResponseDto();
  dto.id = portfolio.id;
  dto.name = portfolio.name;
  dto.baseCurrency = portfolio.baseCurrency;
  dto.createdAt = portfolio.createdAt.toISOString();
  dto.updatedAt = portfolio.updatedAt.toISOString();
  dto.totalValue = portfolio.totalValue().toString();
  return dto;
}

function mapSnapshotToResponse(
  snapshot: PortfolioSnapshot,
): PortfolioSnapshotResponseDto {
  const dto = new PortfolioSnapshotResponseDto();
  dto.id = snapshot.id;
  dto.portfolioId = snapshot.portfolioId;
  dto.value = snapshot.value.toString();
  dto.observedAt = snapshot.observedAt.toISOString();
  dto.createdAt = snapshot.createdAt.toISOString();
  return dto;
}

@ApiTags('Portfolios')
@Controller('api/v1/portfolios')
@UseFilters(DomainExceptionFilter)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: 'Create a portfolio' })
  @ApiResponse({ status: 201, type: PortfolioResponseDto })
  async create(
    @Body() dto: CreatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.create({
      name: dto.name,
      baseCurrency: dto.baseCurrency,
    });
    return mapPortfolioToResponse(portfolio);
  }

  @Get()
  @ApiOperation({ summary: 'List all portfolios' })
  @ApiResponse({ status: 200, type: [PortfolioResponseDto] })
  async findAll(): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.portfolioService.findAll();
    return portfolios.map(mapPortfolioToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio by ID' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto })
  async findById(@Param('id') id: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.findById(id);
    return mapPortfolioToResponse(portfolio);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a portfolio' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.update(id, {
      name: dto.name,
      baseCurrency: dto.baseCurrency,
    });
    return mapPortfolioToResponse(portfolio);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a portfolio' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.portfolioService.delete(id);
  }

  @Post(':id/snapshots')
  @ApiOperation({ summary: 'Take a portfolio snapshot' })
  @ApiResponse({ status: 201, type: PortfolioSnapshotResponseDto })
  async takeSnapshot(
    @Param('id') id: string,
  ): Promise<PortfolioSnapshotResponseDto> {
    const snapshot = await this.portfolioService.takeSnapshot(id);
    return mapSnapshotToResponse(snapshot);
  }

  @Get(':id/snapshots')
  @ApiOperation({ summary: 'Get portfolio snapshots' })
  @ApiResponse({ status: 200, type: [PortfolioSnapshotResponseDto] })
  async getSnapshots(
    @Param('id') id: string,
  ): Promise<PortfolioSnapshotResponseDto[]> {
    const snapshots = await this.portfolioService.getSnapshots(id);
    return snapshots.map(mapSnapshotToResponse);
  }
}
