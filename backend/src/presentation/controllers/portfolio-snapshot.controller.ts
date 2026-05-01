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
import { PortfolioSnapshotService } from '../../application/services/portfolio-snapshot.service.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { CreatePortfolioSnapshotDto } from '../dto/portfolio-snapshot/index.js';
import { PortfolioSnapshotResponseDto } from '../dto/responses/index.js';
import { mapPortfolioSnapshotToResponse } from './mappers/portfolio-snapshot.mapper.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';

@ApiTags('Portfolio Snapshots')
@Controller('api/v1/portfolio-snapshots')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class PortfolioSnapshotController {
  constructor(
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List all portfolio snapshots ordered by observation date descending',
  })
  @ApiResponse({ status: 200, type: [PortfolioSnapshotResponseDto] })
  @ApiStandardErrors([500])
  async findAll(): Promise<PortfolioSnapshotResponseDto[]> {
    const snapshots = await this.portfolioSnapshotService.findAll();
    return snapshots.map(mapPortfolioSnapshotToResponse);
  }

  @Get('current-value')
  @ApiOperation({
    summary:
      'Get computed current net worth (sum of latest asset snapshot values)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'Net worth as decimal string' },
        currency: { type: 'string', example: 'EUR' },
      },
    },
  })
  @ApiStandardErrors([500])
  async getCurrentValue(): Promise<{ value: string; currency: string }> {
    return this.portfolioSnapshotService.getCurrentValue();
  }

  @Post()
  @ApiOperation({
    summary:
      'Take a portfolio snapshot. If value is omitted, it is computed automatically.',
  })
  @ApiResponse({ status: 201, type: PortfolioSnapshotResponseDto })
  @ApiStandardErrors([400, 500])
  async create(
    @Body() dto: CreatePortfolioSnapshotDto,
  ): Promise<PortfolioSnapshotResponseDto> {
    const snapshot = await this.portfolioSnapshotService.create({
      value: dto.value,
      currency: dto.currency,
      notes: dto.notes,
      observedAt: dto.observedAt ? new Date(dto.observedAt) : undefined,
    });
    return mapPortfolioSnapshotToResponse(snapshot);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a portfolio snapshot' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.portfolioSnapshotService.delete(id);
  }
}
