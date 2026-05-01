import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PortfolioSnapshot } from '../../domain/entities/index.js';
import {
  IPortfolioSnapshotRepository,
  IAssetRepository,
} from '../../domain/ports/index.js';
import { PortfolioSnapshotNotFoundException } from '../../domain/exceptions/index.js';

export interface CreatePortfolioSnapshotInput {
  value?: string;
  currency?: string;
  notes?: string;
  observedAt?: Date;
}

@Injectable()
export class PortfolioSnapshotService {
  constructor(
    private readonly portfolioSnapshotRepository: IPortfolioSnapshotRepository,
    private readonly assetRepository: IAssetRepository,
  ) {}

  /** Sum of latest AssetSnapshot.value for every non-disposed asset. */
  async computeCurrentValue(): Promise<Decimal> {
    const assets = await this.assetRepository.findAll();
    return assets
      .filter((a) => !a.disposed)
      .reduce((sum, a) => {
        const val = a.currentValue();
        return val ? sum.plus(val) : sum;
      }, new Decimal(0));
  }

  async create(input: CreatePortfolioSnapshotInput): Promise<PortfolioSnapshot> {
    const value =
      input.value != null
        ? input.value
        : (await this.computeCurrentValue()).toString();

    return this.portfolioSnapshotRepository.save({
      value,
      currency: input.currency ?? 'EUR',
      notes: input.notes,
      observedAt: input.observedAt ?? new Date(),
    });
  }

  async findAll(): Promise<PortfolioSnapshot[]> {
    return this.portfolioSnapshotRepository.findAll();
  }

  async findById(id: string): Promise<PortfolioSnapshot> {
    const snapshot = await this.portfolioSnapshotRepository.findById(id);
    if (!snapshot)
      throw new PortfolioSnapshotNotFoundException(
        `Portfolio snapshot ${id} not found`,
      );
    return snapshot;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.portfolioSnapshotRepository.delete(id);
  }

  async getCurrentValue(): Promise<{ value: string; currency: string }> {
    const value = await this.computeCurrentValue();
    return { value: value.toString(), currency: 'EUR' };
  }
}
