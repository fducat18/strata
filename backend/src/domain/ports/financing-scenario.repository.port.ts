import {
  FinancingScenario,
  FinancingScenarioInputs,
} from '../entities/financing-scenario.entity.js';

export interface CreateFinancingScenarioData {
  name: string;
  currency: string;
  inputs: FinancingScenarioInputs;
}

export abstract class IFinancingScenarioRepository {
  abstract findAll(): Promise<FinancingScenario[]>;
  abstract findById(id: string): Promise<FinancingScenario | null>;
  abstract create(data: CreateFinancingScenarioData): Promise<FinancingScenario>;
  abstract update(
    id: string,
    data: CreateFinancingScenarioData,
  ): Promise<FinancingScenario>;
  abstract delete(id: string): Promise<void>;
}
