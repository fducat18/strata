import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IFinancingScenarioRepository,
  type CreateFinancingScenarioData,
} from '../../domain/ports/financing-scenario.repository.port.js';
import {
  FinancingScenario,
  type FinancingScenarioInputs,
} from '../../domain/entities/financing-scenario.entity.js';

@Injectable()
export class PrismaFinancingScenarioRepository extends IFinancingScenarioRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: {
    id: string;
    name: string;
    currency: string;
    inputsJson: string;
    createdAt: Date;
    updatedAt: Date;
  }): FinancingScenario {
    const parsed = JSON.parse(data.inputsJson) as FinancingScenarioInputs & {
      insuranceFeePercent?: string;
    };
    const normalized: FinancingScenarioInputs = {
      ...parsed,
      insuranceFeePercent: parsed.insuranceFeePercent ?? '0',
    };
    return new FinancingScenario(
      data.id,
      data.name,
      data.currency,
      normalized,
      data.createdAt,
      data.updatedAt,
    );
  }

  async findAll(): Promise<FinancingScenario[]> {
    const records = await this.prisma.financingScenario.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return records.map((record) => this.mapToEntity(record));
  }

  async findById(id: string): Promise<FinancingScenario | null> {
    const record = await this.prisma.financingScenario.findUnique({ where: { id } });
    return record ? this.mapToEntity(record) : null;
  }

  async create(data: CreateFinancingScenarioData): Promise<FinancingScenario> {
    const record = await this.prisma.financingScenario.create({
      data: {
        name: data.name,
        currency: data.currency,
        inputsJson: JSON.stringify(data.inputs),
      },
    });
    return this.mapToEntity(record);
  }

  async update(
    id: string,
    data: CreateFinancingScenarioData,
  ): Promise<FinancingScenario> {
    const record = await this.prisma.financingScenario.update({
      where: { id },
      data: {
        name: data.name,
        currency: data.currency,
        inputsJson: JSON.stringify(data.inputs),
      },
    });
    return this.mapToEntity(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.financingScenario.delete({ where: { id } });
  }
}
