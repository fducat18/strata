import { Injectable } from '@nestjs/common';
import { Portfolio, PortfolioSnapshot } from '../../domain/entities/index.js';
import {
  IPortfolioRepository,
  IPortfolioSnapshotRepository,
  type CreatePortfolioData,
  type UpdatePortfolioData,
} from '../../domain/ports/index.js';
import { PortfolioNotFoundException } from '../../domain/exceptions/index.js';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly portfolioSnapshotRepository: IPortfolioSnapshotRepository,
  ) {}

  async create(data: CreatePortfolioData): Promise<Portfolio> {
    return this.portfolioRepository.save(data);
  }

  async findById(id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findById(id);
    if (!portfolio)
      throw new PortfolioNotFoundException(`Portfolio ${id} not found`);
    return portfolio;
  }

  async findAll(): Promise<Portfolio[]> {
    return this.portfolioRepository.findAll();
  }

  async update(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
    await this.findById(id);
    return this.portfolioRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.portfolioRepository.delete(id);
  }

  async takeSnapshot(id: string): Promise<PortfolioSnapshot> {
    const portfolio = await this.findById(id);
    const totalValue = portfolio.totalValue();
    return this.portfolioSnapshotRepository.save({
      portfolioId: id,
      value: totalValue.toString(),
      observedAt: new Date(),
    });
  }

  async getSnapshots(id: string): Promise<PortfolioSnapshot[]> {
    await this.findById(id);
    return this.portfolioSnapshotRepository.findByPortfolio(id);
  }
}
