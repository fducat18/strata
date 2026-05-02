import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';

export interface CreatePortfolioSnapshotData {
  value: string;
  currency?: string;
  notes?: string;
  observedAt: Date;
}

export abstract class IPortfolioSnapshotRepository {
  abstract save(data: CreatePortfolioSnapshotData): Promise<PortfolioSnapshot>;
  abstract findAll(): Promise<PortfolioSnapshot[]>;
  abstract findById(id: string): Promise<PortfolioSnapshot | null>;
  abstract delete(id: string): Promise<void>;
  abstract upsertForDate(date: Date, value: string): Promise<PortfolioSnapshot>;
  abstract findAllAfter(date: Date): Promise<PortfolioSnapshot[]>;
  abstract updateValue(id: string, value: string): Promise<PortfolioSnapshot>;
}
