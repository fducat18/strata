import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import type { Asset } from '../../domain/entities/asset.entity.js';
import {
  FinancingScenario,
  type FinancingScenarioInputs,
} from '../../domain/entities/financing-scenario.entity.js';
import {
  IAssetRepository,
  IFinancingScenarioRepository,
  type CreateFinancingScenarioData,
} from '../../domain/ports/index.js';
import {
  calculateFinancingScenario,
  type FinancingScenarioCalculation,
} from './financing-scenario-calculator.js';

export interface SaveFinancingScenarioInput {
  name: string;
  purchasePrice: string;
  customDownPayment: string;
  emergencyReserve: string;
  monthlyAvailableAmount: string;
  loanRatePercent: string;
  insuranceFeePercent?: string;
  loanDurationMonths: number;
  loanSetupFee?: string;
  assets: Array<{
    assetId: string;
    available: boolean;
    annualReturnPercent: string;
  }>;
}

export interface FinancingScenarioView extends FinancingScenario {
  calculation: FinancingScenarioCalculation;
}

const CURRENCY = 'EUR';
const MONEY_DIGITS = 2;

@Injectable()
export class FinancingScenarioService {
  constructor(
    private readonly scenarioRepository: IFinancingScenarioRepository,
    private readonly assetRepository: IAssetRepository,
  ) {}

  async findAll(): Promise<FinancingScenarioView[]> {
    const records = await this.scenarioRepository.findAll();
    return records.map((scenario) => this.toView(scenario));
  }

  async findById(id: string): Promise<FinancingScenarioView> {
    const scenario = await this.scenarioRepository.findById(id);
    if (!scenario) throw new NotFoundException(`Financing scenario ${id} not found`);
    return this.toView(scenario);
  }

  async create(input: SaveFinancingScenarioInput): Promise<FinancingScenarioView> {
    const data = await this.resolveData(input);
    const scenario = await this.scenarioRepository.create(data);
    return this.toView(scenario);
  }

  async update(
    id: string,
    input: SaveFinancingScenarioInput,
  ): Promise<FinancingScenarioView> {
    await this.requireScenario(id);
    const data = await this.resolveData(input);
    const scenario = await this.scenarioRepository.update(id, data);
    return this.toView(scenario);
  }

  async recalculate(id: string): Promise<FinancingScenarioView> {
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.requireScenario(id);
    await this.scenarioRepository.delete(id);
  }

  private async requireScenario(id: string): Promise<FinancingScenario> {
    const scenario = await this.scenarioRepository.findById(id);
    if (!scenario) throw new NotFoundException(`Financing scenario ${id} not found`);
    return scenario;
  }

  private async resolveData(
    input: SaveFinancingScenarioInput,
  ): Promise<CreateFinancingScenarioData> {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Scenario name is required');

    const seenAssetIds = new Set<string>();
    for (const item of input.assets) {
      if (seenAssetIds.has(item.assetId)) {
        throw new BadRequestException(`Asset ${item.assetId} is listed more than once`);
      }
      seenAssetIds.add(item.assetId);
    }

    const assets = await Promise.all(
      input.assets.map(async (item) => {
        const asset = await this.assetRepository.findById(item.assetId);
        if (!asset) {
          throw new BadRequestException(`Asset ${item.assetId} does not exist`);
        }
        return this.snapshotAsset(item, asset);
      }),
    );
    const inputs: FinancingScenarioInputs = {
      purchasePrice: input.purchasePrice,
      customDownPayment: input.customDownPayment,
      emergencyReserve: input.emergencyReserve,
      monthlyAvailableAmount: input.monthlyAvailableAmount,
      loanRatePercent: input.loanRatePercent,
      insuranceFeePercent: input.insuranceFeePercent ?? '0',
      loanDurationMonths: input.loanDurationMonths,
      loanSetupFee: input.loanSetupFee ?? '0.00',
      assets,
    };

    try {
      calculateFinancingScenario(inputs, CURRENCY);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid scenario assumptions';
      throw new BadRequestException(message);
    }

    return { name, currency: CURRENCY, inputs };
  }

  private snapshotAsset(
    item: SaveFinancingScenarioInput['assets'][number],
    asset: Asset,
  ): FinancingScenarioInputs['assets'][number] {
    const latestBalance = asset.currentValue() ?? new Decimal(0);
    if (asset.assetType?.group !== 'SAVINGS') {
      throw new BadRequestException(
        `Asset ${asset.id} is not in the SAVINGS group and cannot be included in a financing scenario`,
      );
    }
    if (item.available && asset.disposed) {
      throw new BadRequestException(`Disposed asset ${asset.id} cannot be available in a scenario`);
    }
    if (item.available && latestBalance.isNegative()) {
      throw new BadRequestException(`Available asset ${asset.id} must have a non-negative balance`);
    }
    return {
      assetId: asset.id,
      name: asset.name,
      balance: latestBalance
        .toDecimalPlaces(MONEY_DIGITS, Decimal.ROUND_HALF_UP)
        .toFixed(MONEY_DIGITS, Decimal.ROUND_HALF_UP),
      available: item.available,
      annualReturnPercent: item.annualReturnPercent,
    };
  }

  private toView(scenario: FinancingScenario): FinancingScenarioView {
    return Object.assign(scenario, {
      calculation: calculateFinancingScenario(scenario.inputs, scenario.currency),
    });
  }
}
