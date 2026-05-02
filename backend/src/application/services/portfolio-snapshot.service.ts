import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PortfolioSnapshot } from '../../domain/entities/index.js';
import {
  IPortfolioSnapshotRepository,
  IAssetSnapshotRepository,
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
    private readonly assetSnapshotRepository: IAssetSnapshotRepository,
  ) {}

  /**
   * Sum of the latest AssetSnapshot.value for every non-disposed asset.
   * Uses a targeted query instead of loading all assets with their relations.
   */
  async computeCurrentValue(): Promise<Decimal> {
    const snapshots =
      await this.assetSnapshotRepository.findLatestPerNonDisposedAsset();
    return snapshots.reduce(
      (sum, s) => sum.plus(s.value),
      new Decimal(0),
    );
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

  /**
   * Recalculates portfolio snapshots from `fromDate` forward.
   * - Upserts a PortfolioSnapshot for `fromDate`
   * - Updates any existing PortfolioSnapshot rows with observedAt > fromDate
   *
   * Formula: SUM(latest AssetSnapshot per non-disposed asset as of date D)
   */
  async recalculateFromDate(fromDate: Date): Promise<void> {
    const fromDateValue = await this.computeValueAsOf(fromDate);
    await this.portfolioSnapshotRepository.upsertForDate(fromDate, fromDateValue.toString());

    const futureSnapshots = await this.portfolioSnapshotRepository.findAllAfter(fromDate);
    for (const snap of futureSnapshots) {
      const value = await this.computeValueAsOf(snap.observedAt);
      await this.portfolioSnapshotRepository.updateValue(snap.id, value.toString());
    }
  }

  private async computeValueAsOf(date: Date): Promise<Decimal> {
    const snapshots = await this.assetSnapshotRepository.findLatestPerNonDisposedAssetAsOf(date);
    return snapshots.reduce((sum, s) => sum.plus(s.value), new Decimal(0));
  }
}
