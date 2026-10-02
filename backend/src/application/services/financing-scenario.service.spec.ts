import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { Asset } from '../../domain/entities/asset.entity.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import { AssetSnapshot } from '../../domain/entities/asset-snapshot.entity.js';
import {
  FinancingScenario,
  type FinancingScenarioInputs,
} from '../../domain/entities/financing-scenario.entity.js';
import { FinancingScenarioService } from './financing-scenario.service.js';

const ASSET_ID = '00000000-0000-4000-8000-000000000001';
const SCENARIO_ID = 'scenario-1';
const fixedDate = new Date('2026-01-01T00:00:00.000Z');

function makeAsset(
  value: string | null = '100000.00',
  disposed = false,
  typeGroup = 'SAVINGS',
): Asset {
  return new Asset(
    ASSET_ID,
    'Savings Account',
    null,
    disposed,
    'type-1',
    fixedDate,
    fixedDate,
    new AssetType('type-1', 'SAVINGS_ACCOUNT', 'Savings Account', typeGroup),
    value === null
      ? []
      : [new AssetSnapshot('snapshot-1', ASSET_ID, new Decimal(value), fixedDate, fixedDate)],
  );
}

const input = {
  name: '  Car  ',
  purchasePrice: '10000.00',
  customDownPayment: '5000.00',
  emergencyReserve: '10000.00',
  monthlyAvailableAmount: '1000.00',
  loanRatePercent: '8',
  insuranceFeePercent: '0',
  loanDurationMonths: 12,
  loanSetupFee: '0.00',
  assets: [{ assetId: ASSET_ID, available: true, annualReturnPercent: '5' }],
};

function saved(inputs: FinancingScenarioInputs): FinancingScenario {
  return new FinancingScenario(SCENARIO_ID, 'Car', 'EUR', inputs, fixedDate, fixedDate);
}

describe('FinancingScenarioService', () => {
  let service: FinancingScenarioService;
  let scenarioRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let assetRepository: { findById: jest.Mock };

  beforeEach(() => {
    scenarioRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    assetRepository = { findById: jest.fn().mockResolvedValue(makeAsset()) };
    service = new FinancingScenarioService(
      scenarioRepository as never,
      assetRepository as never,
    );
  });

  it('captures asset data from the repository and saves a detached input snapshot', async () => {
    const scenario = saved({
      purchasePrice: input.purchasePrice,
      customDownPayment: input.customDownPayment,
      emergencyReserve: input.emergencyReserve,
      monthlyAvailableAmount: input.monthlyAvailableAmount,
      loanRatePercent: input.loanRatePercent,
      insuranceFeePercent: input.insuranceFeePercent,
      loanDurationMonths: input.loanDurationMonths,
      loanSetupFee: input.loanSetupFee,
      assets: [{
        assetId: ASSET_ID,
        name: 'Savings Account',
        balance: '100000.00',
        available: true,
        annualReturnPercent: '5',
      }],
    });
    scenarioRepository.create.mockResolvedValue(scenario);

    const result = await service.create(input);

    expect(scenarioRepository.create).toHaveBeenCalledWith({
      name: 'Car',
      currency: 'EUR',
      inputs: scenario.inputs,
    });
    expect(result.calculation.startingSavings).toBe('100000.00');
    expect(result.calculation.options).toHaveLength(3);
    expect(assetRepository.findById).toHaveBeenCalledWith(ASSET_ID);
  });

  it('lists and recalculates saved snapshots without rereading the portfolio', async () => {
    const scenario = saved({
      ...input,
      assets: [{
        assetId: ASSET_ID,
        name: 'Saved Name',
        balance: '100000.00',
        available: true,
        annualReturnPercent: '5',
      }],
    });
    scenarioRepository.findAll.mockResolvedValue([scenario]);
    scenarioRepository.findById.mockResolvedValue(scenario);

    const listed = await service.findAll();
    const recalculated = await service.recalculate(SCENARIO_ID);

    expect(listed[0].calculation.options[2].savingsReturn).toBe('5152.48');
    expect(recalculated.calculation.options[2].savingsReturn).toBe('5152.48');
    expect(assetRepository.findById).not.toHaveBeenCalled();
  });

  it('allows a saved draft without eligible assets and reports its status', async () => {
    assetRepository.findById.mockResolvedValue(makeAsset(null));
    const scenario = saved({
      ...input,
      assets: [{
        assetId: ASSET_ID,
        name: 'Savings Account',
        balance: '0.00',
        available: false,
        annualReturnPercent: '5',
      }],
    });
    scenarioRepository.create.mockResolvedValue(scenario);

    const result = await service.create({ ...input, assets: [{ ...input.assets[0], available: false }] });

    expect(result.calculation.status).toBe('NO_ELIGIBLE_ASSETS');
    expect(result.calculation.options).toEqual([]);
  });

  it('updates full scenario assumptions and recaptures the source balance', async () => {
    const scenario = saved({
      ...input,
      assets: [{
        assetId: ASSET_ID,
        name: 'Savings Account',
        balance: '125000.00',
        available: true,
        annualReturnPercent: '5',
      }],
    });
    scenarioRepository.findById.mockResolvedValue(scenario);
    scenarioRepository.update.mockResolvedValue(scenario);
    assetRepository.findById.mockResolvedValue(makeAsset('125000'));

    await service.update(SCENARIO_ID, { ...input, purchasePrice: '12000.00' });

    expect(scenarioRepository.update).toHaveBeenCalledWith(
      SCENARIO_ID,
      expect.objectContaining({
        name: 'Car',
        inputs: expect.objectContaining({ purchasePrice: '12000.00' }),
      }),
    );
  });

  it('rejects empty names, duplicate or missing assets, unavailable numeric contracts, and disposed sources', async () => {
    await expect(service.create({ ...input, name: '   ' })).rejects.toThrow(BadRequestException);
    await expect(service.create({
      ...input,
      assets: [input.assets[0], input.assets[0]],
    })).rejects.toThrow(/listed more than once/);

    assetRepository.findById.mockResolvedValue(null);
    await expect(service.create(input)).rejects.toThrow(/does not exist/);

    assetRepository.findById.mockResolvedValue(makeAsset('100000', true));
    await expect(service.create(input)).rejects.toThrow(/Disposed asset/);

    assetRepository.findById.mockResolvedValue(makeAsset('-1'));
    await expect(service.create(input)).rejects.toThrow(/non-negative balance/);
  });

  it('rejects non-savings assets from financing scenario inputs', async () => {
    assetRepository.findById.mockResolvedValue(makeAsset('100000.00', false, 'FINANCIAL'));

    await expect(service.create(input)).rejects.toThrow(/not in the SAVINGS group/);
    await expect(service.create({
      ...input,
      assets: [{ ...input.assets[0], available: false }],
    })).rejects.toThrow(/not in the SAVINGS group/);
  });

  it('returns not found for missing records and deletes only an existing scenario', async () => {
    scenarioRepository.findById.mockResolvedValue(null);
    await expect(service.findById(SCENARIO_ID)).rejects.toThrow(NotFoundException);
    await expect(service.update(SCENARIO_ID, input)).rejects.toThrow(NotFoundException);
    await expect(service.delete(SCENARIO_ID)).rejects.toThrow(NotFoundException);

    scenarioRepository.findById.mockResolvedValue(saved({ ...input, assets: [] }));
    scenarioRepository.delete.mockResolvedValue(undefined);
    await service.delete(SCENARIO_ID);
    expect(scenarioRepository.delete).toHaveBeenCalledWith(SCENARIO_ID);
  });
});
