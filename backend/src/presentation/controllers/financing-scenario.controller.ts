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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FinancingScenarioService } from '../../application/services/financing-scenario.service.js';
import { CreateFinancingScenarioDto } from '../dto/financing-scenario/index.js';
import { FinancingScenarioResponseDto } from '../dto/responses/financing-scenario.response.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';
import { mapFinancingScenarioToResponse } from './mappers/financing-scenario.mapper.js';

@ApiTags('Financing Scenarios')
@Controller('api/v1/financing-scenarios')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class FinancingScenarioController {
  constructor(private readonly service: FinancingScenarioService) {}

  @Get()
  @ApiOperation({ summary: 'List saved financing scenarios with recalculated comparisons' })
  @ApiResponse({ status: 200, type: [FinancingScenarioResponseDto] })
  @ApiStandardErrors([500])
  async findAll(): Promise<FinancingScenarioResponseDto[]> {
    const scenarios = await this.service.findAll();
    return scenarios.map(mapFinancingScenarioToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get and recalculate a saved financing scenario' })
  @ApiResponse({ status: 200, type: FinancingScenarioResponseDto })
  @ApiStandardErrors([404, 500])
  async findById(@Param('id') id: string): Promise<FinancingScenarioResponseDto> {
    return mapFinancingScenarioToResponse(await this.service.findById(id));
  }

  @Post()
  @ApiOperation({ summary: 'Save a financing scenario and compare all three options' })
  @ApiResponse({ status: 201, type: FinancingScenarioResponseDto })
  @ApiStandardErrors([400, 500])
  async create(
    @Body() dto: CreateFinancingScenarioDto,
  ): Promise<FinancingScenarioResponseDto> {
    return mapFinancingScenarioToResponse(await this.service.create(dto));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update saved assumptions and capture current asset balances' })
  @ApiResponse({ status: 200, type: FinancingScenarioResponseDto })
  @ApiStandardErrors([400, 404, 500])
  async update(
    @Param('id') id: string,
    @Body() dto: CreateFinancingScenarioDto,
  ): Promise<FinancingScenarioResponseDto> {
    return mapFinancingScenarioToResponse(await this.service.update(id, dto));
  }

  @Post(':id/recalculate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recalculate saved assumptions without changing portfolio records' })
  @ApiResponse({ status: 200, type: FinancingScenarioResponseDto })
  @ApiStandardErrors([404, 500])
  async recalculate(
    @Param('id') id: string,
  ): Promise<FinancingScenarioResponseDto> {
    return mapFinancingScenarioToResponse(await this.service.recalculate(id));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a saved financing scenario' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(id);
  }
}
