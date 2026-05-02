import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IPortfolioSnapshotRepository,
  CreatePortfolioSnapshotData,
} from '../../domain/ports/portfolio-snapshot.repository.port.js';
import { PortfolioSnapshot } from '../../domain/entities/portfolio-snapshot.entity.js';

type PortfolioSnapshotModel = {
  id: string;
  value: { toString(): string };
  currency: string;
  notes: string | null;
  observedAt: Date;
  createdAt: Date;
};

@Injectable()
export class PrismaPortfolioSnapshotRepository extends IPortfolioSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: PortfolioSnapshotModel): PortfolioSnapshot {
    return new PortfolioSnapshot(
      data.id,
      new Decimal(data.value.toString()),
      data.currency,
      data.notes,
      data.observedAt,
      data.createdAt,
    );
  }

  async save(data: CreatePortfolioSnapshotData): Promise<PortfolioSnapshot> {
    const result = await this.prisma.portfolioSnapshot.create({
      data: {
        value: new Decimal(data.value),
        currency: data.currency ?? 'EUR',
        notes: data.notes,
        observedAt: data.observedAt,
      },
    });
    return this.mapToEntity(result);
  }

  async findAll(): Promise<PortfolioSnapshot[]> {
    const results = await this.prisma.portfolioSnapshot.findMany({
      orderBy: { observedAt: 'desc' },
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async findById(id: string): Promise<PortfolioSnapshot | null> {
    const result = await this.prisma.portfolioSnapshot.findUnique({
      where: { id },
    });
    return result ? this.mapToEntity(result) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.portfolioSnapshot.delete({ where: { id } });
  }

  async upsertForDate(date: Date, value: string): Promise<PortfolioSnapshot> {
    const result = await this.prisma.portfolioSnapshot.upsert({
      where: { observedAt: date },
      update: { value: new Decimal(value) },
      create: {
        value: new Decimal(value),
        currency: 'EUR',
        observedAt: date,
      },
    });
    return this.mapToEntity(result);
  }

  async findAllAfter(date: Date): Promise<PortfolioSnapshot[]> {
    const results = await this.prisma.portfolioSnapshot.findMany({
      where: { observedAt: { gt: date } },
      orderBy: { observedAt: 'asc' },
    });
    return results.map((r) => this.mapToEntity(r));
  }

  async updateValue(id: string, value: string): Promise<PortfolioSnapshot> {
    const result = await this.prisma.portfolioSnapshot.update({
      where: { id },
      data: { value: new Decimal(value) },
    });
    return this.mapToEntity(result);
  }
}
