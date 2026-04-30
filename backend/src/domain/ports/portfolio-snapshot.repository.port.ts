import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';

export interface CreatePortfolioSnapshotData {
  portfolioId: string;
  value: string;
  observedAt: Date;
}

export abstract class IPortfolioSnapshotRepository {
  abstract save(data: CreatePortfolioSnapshotData): Promise<PortfolioSnapshot>;
  abstract findByPortfolio(portfolioId: string): Promise<PortfolioSnapshot[]>;
}
