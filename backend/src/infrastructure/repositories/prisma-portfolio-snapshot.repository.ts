import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IPortfolioSnapshotRepository,
  CreatePortfolioSnapshotData,
} from '../../domain/ports/portfolio-snapshot.repository.port.js';
import { PortfolioSnapshot } from '../../domain/entities/portfolio-snapshot.entity.js';

@Injectable()
export class PrismaPortfolioSnapshotRepository extends IPortfolioSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: any): PortfolioSnapshot {
    return new PortfolioSnapshot(
      data.id,
      data.portfolioId,
      new Decimal(data.value.toString()),
      data.observedAt,
      data.createdAt,
    );
  }

  async save(data: CreatePortfolioSnapshotData): Promise<PortfolioSnapshot> {
    const result = await this.prisma.portfolioSnapshot.create({
      data: {
        portfolioId: data.portfolioId,
        value: new Decimal(data.value),
        observedAt: data.observedAt,
      },
    });
    return this.mapToEntity(result);
  }

  async findByPortfolio(portfolioId: string): Promise<PortfolioSnapshot[]> {
    const results = await this.prisma.portfolioSnapshot.findMany({
      where: { portfolioId },
      orderBy: { observedAt: 'desc' },
    });
    return results.map((r) => this.mapToEntity(r));
  }
}
