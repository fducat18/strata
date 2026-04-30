import { Portfolio } from '../entities/portfolio.entity';

export interface CreatePortfolioData {
  name: string;
  baseCurrency: string;
}

export interface UpdatePortfolioData {
  name?: string;
  baseCurrency?: string;
}

export abstract class IPortfolioRepository {
  abstract save(data: CreatePortfolioData): Promise<Portfolio>;
  abstract findById(id: string): Promise<Portfolio | null>;
  abstract findAll(): Promise<Portfolio[]>;
  abstract update(id: string, data: UpdatePortfolioData): Promise<Portfolio>;
  abstract delete(id: string): Promise<void>;
}
