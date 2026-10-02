import {
  calculateFinancingScenario,
  type FinancingScenarioCalculation,
} from './financing-scenario-calculator.js';
import type { FinancingScenarioInputs } from '../../domain/entities/financing-scenario.entity.js';

const referenceInputs: FinancingScenarioInputs = {
  purchasePrice: '10000.00',
  customDownPayment: '5000.00',
  emergencyReserve: '0.00',
  monthlyAvailableAmount: '1000.00',
  loanRatePercent: '8',
  insuranceFeePercent: '0',
  loanDurationMonths: 12,
  loanSetupFee: '0.00',
  assets: [
    {
      assetId: 'savings',
      name: 'Savings',
      balance: '100000.00',
      available: true,
      annualReturnPercent: '5',
    },
  ],
};

function complete(result: FinancingScenarioCalculation) {
  expect(result.status).toBe('COMPLETE');
  expect(result.options).toHaveLength(3);
  return result.options;
}

describe('calculateFinancingScenario', () => {
  it('reproduces the published one-year comparison with minor-unit posting', () => {
    const result = calculateFinancingScenario(referenceInputs);
    const [cash, custom, full] = complete(result);

    expect(result.startingSavings).toBe('100000.00');
    expect(cash).toMatchObject({
      type: 'CASH',
      financingCost: '0.00',
      savingsReturn: '4883.44',
      savingsReturnDifference: '0.00',
      finalScenarioSavingsBalance: '106883.44',
      scheduledMonthlyPayment: '0.00',
    });
    expect(custom).toMatchObject({
      type: 'CUSTOM_DOWN_PAYMENT',
      loanPrincipal: '5000.00',
      scheduledMonthlyPayment: '434.94',
      financingCost: '219.31',
      savingsReturn: '5017.94',
      savingsReturnDifference: '134.50',
      finalScenarioSavingsBalance: '106798.63',
    });
    expect(custom.timeline.at(-1)).toMatchObject({
      loanPayment: '434.97',
      remainingLoanBalance: '0.00',
    });
    expect(full).toMatchObject({
      type: 'FULL',
      scheduledMonthlyPayment: '869.88',
      financingCost: '438.62',
      savingsReturn: '5152.48',
      savingsReturnDifference: '269.04',
      finalScenarioSavingsBalance: '106713.86',
    });
    expect(full.timeline.at(-1)).toMatchObject({
      loanPayment: '869.94',
      remainingLoanBalance: '0.00',
    });
  });

  it('excludes unavailable assets and preserves per-asset assumptions', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      assets: [
        { assetId: 'a', name: 'Available', balance: '10000', available: true, annualReturnPercent: '2' },
        { assetId: 'b', name: 'Blocked', balance: '90000', available: false, annualReturnPercent: '6' },
      ],
    });
    const [cash] = complete(result);

    expect(result.startingSavings).toBe('10000.00');
    expect(result.eligibleAssets).toEqual([
      { assetId: 'a', name: 'Available', startingBalance: '10000.00', annualReturnPercent: '2' },
    ]);
    expect(cash.finalScenarioSavingsBalance).toBe('12110.62');
    expect(cash.timeline.every((month) => month.assets.every((asset) => asset.assetId === 'a'))).toBe(true);
  });

  it('returns NO_ELIGIBLE_ASSETS for a saved draft without inventing a projection', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      assets: referenceInputs.assets.map((asset) => ({ ...asset, available: false })),
    });

    expect(result.status).toBe('NO_ELIGIBLE_ASSETS');
    expect(result.options).toEqual([]);
    expect(result.startingSavings).toBe('0.00');
  });

  it('reports an initial reserve breach and keeps the comparison available', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      purchasePrice: '100.00',
      customDownPayment: '50.00',
      emergencyReserve: '950.00',
      monthlyAvailableAmount: '0.00',
      loanRatePercent: '0',
      loanDurationMonths: 12,
      assets: [{ assetId: 'a', name: 'Cash', balance: '1000.00', available: true, annualReturnPercent: '0' }],
    });
    const [cash] = complete(result);

    expect(cash.reserveBreach).toBe(true);
    expect(cash.emergencyReserveAtRisk).toBe(true);
    expect(cash.firstReserveBreachMonth).toBe('initial');
    expect(cash.timeline).toHaveLength(12);
  });

  it('caps withdrawals at zero and reports initial and monthly funding shortfalls', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      purchasePrice: '200.00',
      customDownPayment: '50.00',
      monthlyAvailableAmount: '0.00',
      loanRatePercent: '100',
      loanDurationMonths: 12,
      assets: [{ assetId: 'a', name: 'Cash', balance: '100.00', available: true, annualReturnPercent: '0' }],
    });
    const [cash, , full] = complete(result);

    expect(cash.initialFundingShortfall).toBe('100.00');
    expect(cash.finalScenarioSavingsBalance).toBe('0.00');
    expect(cash.timeline.every((month) => Number(month.savingsBalance) >= 0)).toBe(true);
    expect(full.monthlyFundingShortfall).not.toBe('0.00');
    expect(Number(full.totalFundingShortfall)).toBeGreaterThanOrEqual(Number(full.initialFundingShortfall));
    expect(full.timeline.every((month) => Number(month.savingsBalance) >= 0)).toBe(true);
  });

  it('uses equal contribution allocation when every eligible starting balance is zero', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      purchasePrice: '100.00',
      customDownPayment: '50.00',
      monthlyAvailableAmount: '10.00',
      loanRatePercent: '0',
      loanDurationMonths: 1,
      assets: [
        { assetId: 'a', name: 'A', balance: '0.00', available: true, annualReturnPercent: '0' },
        { assetId: 'b', name: 'B', balance: '0.00', available: true, annualReturnPercent: '0' },
      ],
    });
    const [cash] = complete(result);

    expect(cash.timeline[0].assets.map((asset) => asset.contribution)).toEqual(['5.00', '5.00']);
    expect(cash.finalScenarioSavingsBalance).toBe('10.00');
  });

  it('creates yearly checkpoints from the monthly timeline for a five-year horizon', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      loanDurationMonths: 60,
    });
    const [, , full] = complete(result);

    expect(full.timeline).toHaveLength(60);
    expect(full.yearlyCheckpoints.map((checkpoint) => checkpoint.toMonth)).toEqual([12, 24, 36, 48, 60]);
    expect(full.yearlyCheckpoints[4].endingSavingsBalance).toBe(full.finalScenarioSavingsBalance);
    expect(full.timeline.at(-1)?.remainingLoanBalance).toBe('0.00');
  });

  it('amortises a zero-rate loan without interest', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      loanRatePercent: '0',
    });
    const [, custom] = complete(result);

    expect(custom.financingCost).toBe('0.00');
    expect(custom.scheduledMonthlyPayment).toBe('416.67');
    expect(custom.timeline.at(-1)?.remainingLoanBalance).toBe('0.00');
  });

  it('applies insurance fees only to loan-based options', () => {
    const result = calculateFinancingScenario({
      ...referenceInputs,
      insuranceFeePercent: '0.5',
    });
    const [cash, custom, full] = complete(result);

    expect(cash.insuranceFee).toBe('0.00');
    expect(cash.financingCost).toBe('0.00');
    expect(custom.insuranceFee).toBe('50.00');
    expect(full.insuranceFee).toBe('50.00');
    expect(Number(custom.financingCost)).toBeCloseTo(269.31, 2);
    expect(Number(full.financingCost)).toBeCloseTo(488.62, 2);
  });

  it('rejects down payments, monthly rates, currency values, and money precision outside the contract', () => {
    expect(() => calculateFinancingScenario({ ...referenceInputs, customDownPayment: '0.00' })).toThrow(/customDownPayment/);
    expect(() => calculateFinancingScenario({
      ...referenceInputs,
      assets: [{ ...referenceInputs.assets[0], annualReturnPercent: '-1201' }],
    })).toThrow(/negative monthly balance/);
    expect(() => calculateFinancingScenario(referenceInputs, 'NOT')).toThrow(/Unsupported scenario currency/);
    expect(() => calculateFinancingScenario({ ...referenceInputs, purchasePrice: '10000.001' })).toThrow(/minor unit/);
  });
});
