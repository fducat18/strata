import { Decimal } from 'decimal.js';
import type {
  FinancingScenarioAssetInput,
  FinancingScenarioInputs,
} from '../../domain/entities/financing-scenario.entity.js';

const D = Decimal.clone({ precision: 48, rounding: Decimal.ROUND_HALF_UP });

export type FinancingOptionType = 'CASH' | 'CUSTOM_DOWN_PAYMENT' | 'FULL';
export type FinancingCalculationStatus = 'COMPLETE' | 'NO_ELIGIBLE_ASSETS';

export interface FinancingAssetAssumption {
  assetId: string;
  name: string;
  startingBalance: string;
  annualReturnPercent: string;
}

export interface FinancingAssetMonth {
  assetId: string;
  name: string;
  openingBalance: string;
  savingsReturn: string;
  contribution: string;
  withdrawal: string;
  endingBalance: string;
}

export interface FinancingScenarioMonth {
  month: number;
  savingsReturn: string;
  loanInterest: string;
  loanPrincipal: string;
  loanPayment: string;
  netMonthlyContribution: string;
  monthlyFundingShortfall: string;
  savingsBalance: string;
  remainingLoanBalance: string;
  reserveBreach: boolean;
  assets: FinancingAssetMonth[];
}

export interface FinancingYearCheckpoint {
  year: number;
  fromMonth: number;
  toMonth: number;
  savingsReturn: string;
  loanInterest: string;
  loanPrincipal: string;
  loanPayments: string;
  netMonthlyContributions: string;
  fundingShortfall: string;
  endingSavingsBalance: string;
  remainingLoanBalance: string;
  reserveBreach: boolean;
}

export interface FinancingOptionResult {
  type: FinancingOptionType;
  purchasePrice: string;
  downPayment: string;
  initialOutlay: string;
  loanPrincipal: string;
  loanSetupFee: string;
  insuranceFee: string;
  scheduledMonthlyPayment: string;
  financingCost: string;
  savingsReturn: string;
  savingsReturnDifference: string;
  finalScenarioSavingsBalance: string;
  reserveBreach: boolean;
  firstReserveBreachMonth: 'initial' | number | null;
  emergencyReserveAtRisk: boolean;
  initialFundingShortfall: string;
  monthlyFundingShortfall: string;
  totalFundingShortfall: string;
  status: FinancingCalculationStatus;
  timeline: FinancingScenarioMonth[];
  yearlyCheckpoints: FinancingYearCheckpoint[];
}

export interface FinancingScenarioCalculation {
  status: FinancingCalculationStatus;
  currency: string;
  startingSavings: string;
  emergencyReserve: string;
  monthlyAvailableAmount: string;
  financingHorizonMonths: number;
  loanRatePercent: string;
  loanSetupFee: string;
  withdrawalRule: 'PROPORTIONAL_BY_CURRENT_BALANCE';
  positiveContributionRule: 'PROPORTIONAL_BY_CURRENT_BALANCE_THEN_STARTING_BALANCE_THEN_EQUAL';
  eligibleAssets: FinancingAssetAssumption[];
  options: FinancingOptionResult[];
}

interface MutableAsset {
  assumption: FinancingScenarioAssetInput;
  opening: Decimal;
  balance: Decimal;
}

function currencyDigits(currency: string): number {
  try {
    if (!Intl.supportedValuesOf('currency').includes(currency)) {
      throw new Error(`Unsupported scenario currency: ${currency}`);
    }
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    throw new Error(`Unsupported scenario currency: ${currency}`);
  }
}

function amount(value: string, label: string): Decimal {
  if (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value)) {
    throw new Error(`${label} must be a finite decimal string`);
  }
  const result = new D(value);
  if (!result.isFinite()) throw new Error(`${label} must be finite`);
  return result;
}

function posted(value: Decimal, digits: number): Decimal {
  return value.toDecimalPlaces(digits, D.ROUND_HALF_UP);
}

function money(value: Decimal, digits: number): string {
  return posted(value, digits).toFixed(digits, D.ROUND_HALF_UP);
}

function sum(values: Decimal[]): Decimal {
  return values.reduce((total, value) => total.plus(value), new D(0));
}

function allocate(
  total: Decimal,
  assets: MutableAsset[],
  weights: Decimal[],
  digits: number,
): Decimal[] {
  if (assets.length === 0 || total.isZero()) return assets.map(() => new D(0));
  const weightTotal = sum(weights);
  if (weightTotal.isZero()) return assets.map(() => new D(0));

  let allocated = new D(0);
  return assets.map((_asset, index) => {
    if (index === assets.length - 1) return posted(total.minus(allocated), digits);
    const share = posted(total.times(weights[index]).div(weightTotal), digits);
    allocated = allocated.plus(share);
    return share;
  });
}

function optionInputs(
  type: FinancingOptionType,
  purchasePrice: Decimal,
  customDownPayment: Decimal,
  fee: Decimal,
  insuranceFeePercent: Decimal,
  digits: number,
): {
  downPayment: Decimal;
  outlay: Decimal;
  principal: Decimal;
  optionFee: Decimal;
  optionInsuranceFee: Decimal;
} {
  const insuranceFee = type === 'CASH'
    ? new D(0)
    : posted(purchasePrice.times(insuranceFeePercent).div(100), digits);
  if (type === 'CASH') {
    return {
      downPayment: purchasePrice,
      outlay: purchasePrice,
      principal: new D(0),
      optionFee: new D(0),
      optionInsuranceFee: insuranceFee,
    };
  }
  if (type === 'CUSTOM_DOWN_PAYMENT') {
    const downPayment = posted(customDownPayment, digits);
    return {
      downPayment,
      outlay: posted(downPayment.plus(fee).plus(insuranceFee), digits),
      principal: posted(purchasePrice.minus(downPayment), digits),
      optionFee: fee,
      optionInsuranceFee: insuranceFee,
    };
  }
  return {
    downPayment: new D(0),
    outlay: posted(fee.plus(insuranceFee), digits),
    principal: purchasePrice,
    optionFee: fee,
    optionInsuranceFee: insuranceFee,
  };
}

function validate(inputs: FinancingScenarioInputs, currency: string): number {
  const digits = currencyDigits(currency);
  const purchasePrice = amount(inputs.purchasePrice, 'purchasePrice');
  const downPayment = amount(inputs.customDownPayment, 'customDownPayment');
  const reserve = amount(inputs.emergencyReserve, 'emergencyReserve');
  const monthlyAvailable = amount(
    inputs.monthlyAvailableAmount,
    'monthlyAvailableAmount',
  );
  const annualLoanRate = amount(inputs.loanRatePercent, 'loanRatePercent');
  const insuranceFeePercent = amount(inputs.insuranceFeePercent, 'insuranceFeePercent');
  const setupFee = amount(inputs.loanSetupFee, 'loanSetupFee');
  const duration = inputs.loanDurationMonths;

  if (!purchasePrice.greaterThan(0)) throw new Error('purchasePrice must be greater than zero');
  if (!downPayment.greaterThan(0) || !downPayment.lessThan(purchasePrice)) {
    throw new Error('customDownPayment must be greater than zero and less than purchasePrice');
  }
  if (
    reserve.isNegative()
    || monthlyAvailable.isNegative()
    || setupFee.isNegative()
    || insuranceFeePercent.isNegative()
  ) {
    throw new Error('Monetary inputs must be non-negative');
  }
  if (annualLoanRate.isNegative()) throw new Error('loanRatePercent must be non-negative');
  if (!Number.isSafeInteger(duration) || duration <= 0) {
    throw new Error('loanDurationMonths must be a positive integer');
  }
  for (const asset of inputs.assets) {
    if (!asset.available) continue;
    const balance = amount(asset.balance, `asset ${asset.assetId} balance`);
    const annualReturn = amount(
      asset.annualReturnPercent,
      `asset ${asset.assetId} annualReturnPercent`,
    );
    if (balance.isNegative()) {
      throw new Error(`Available asset ${asset.assetId} must have a non-negative balance`);
    }
    if (new D(1).plus(annualReturn.div(1200)).isNegative()) {
      throw new Error(`Asset ${asset.assetId} return produces a negative monthly balance`);
    }
  }
  for (const [label, value] of [
    ['purchasePrice', purchasePrice],
    ['customDownPayment', downPayment],
    ['emergencyReserve', reserve],
    ['monthlyAvailableAmount', monthlyAvailable],
    ['loanSetupFee', setupFee],
  ] as const) {
    if (value.decimalPlaces() > digits) {
      throw new Error(`${label} exceeds the ${digits}-digit minor unit for ${currency}`);
    }
  }
  return digits;
}

function createOption(
  type: FinancingOptionType,
  digits: number,
  months: number,
  purchasePrice: Decimal,
  customDownPayment: Decimal,
  emergencyReserve: Decimal,
  monthlyAvailableAmount: Decimal,
  annualLoanRate: Decimal,
  insuranceFeePercent: Decimal,
  setupFee: Decimal,
  eligibleSourceAssets: FinancingScenarioAssetInput[],
): FinancingOptionResult {
  const option = optionInputs(
    type,
    purchasePrice,
    customDownPayment,
    setupFee,
    insuranceFeePercent,
    digits,
  );
  const monthlyRate = annualLoanRate.div(1200);
  const rawPayment = option.principal.isZero()
    ? new D(0)
    : monthlyRate.isZero()
      ? option.principal.div(months)
      : option.principal
          .times(monthlyRate)
          .div(new D(1).minus(new D(1).plus(monthlyRate).pow(-months)));
  const scheduledPayment = posted(rawPayment, digits);
  const assets: MutableAsset[] = eligibleSourceAssets.map((assumption) => {
    const balance = posted(amount(assumption.balance, 'asset balance'), digits);
    return { assumption, opening: balance, balance };
  });
  const startingSavings = sum(assets.map((asset) => asset.balance));
  const actualOutlay = Decimal.min(option.outlay, startingSavings);
  const initialFundingShortfall = posted(
    Decimal.max(new D(0), option.outlay.minus(startingSavings)),
    digits,
  );
  const initialWithdrawals = allocate(
    actualOutlay,
    assets,
    assets.map((asset) => asset.balance),
    digits,
  );
  assets.forEach((asset, index) => {
    asset.balance = posted(Decimal.max(new D(0), asset.balance.minus(initialWithdrawals[index])), digits);
  });

  let firstReserveBreachMonth: 'initial' | number | null = null;
  if (sum(assets.map((asset) => asset.balance)).lessThan(emergencyReserve)) {
    firstReserveBreachMonth = 'initial';
  }

  let remainingLoan = posted(option.principal, digits);
  let totalInterest = new D(0);
  let totalSavingsReturn = new D(0);
  let totalMonthlyShortfall = new D(0);
  let yearStartMonth = 1;
  let yearStartIndex = 0;
  const timeline: FinancingScenarioMonth[] = [];
  const yearlyCheckpoints: FinancingYearCheckpoint[] = [];

  for (let month = 1; month <= months; month += 1) {
    const openingLoanBalance = remainingLoan;
    const interest = posted(openingLoanBalance.times(monthlyRate), digits);
    let principal = new D(0);
    let payment = new D(0);
    if (!option.principal.isZero()) {
      if (month === months) {
        principal = openingLoanBalance;
        payment = posted(interest.plus(principal), digits);
      } else {
        payment = scheduledPayment;
        principal = posted(Decimal.min(openingLoanBalance, payment.minus(interest)), digits);
        payment = posted(interest.plus(principal), digits);
      }
    }
    remainingLoan = posted(Decimal.max(new D(0), openingLoanBalance.minus(principal)), digits);

    const assetRows: FinancingAssetMonth[] = [];
    let monthlySavingsReturn = new D(0);
    for (const asset of assets) {
      const openingBalance = asset.balance;
      const annualReturn = amount(
        asset.assumption.annualReturnPercent,
        `asset ${asset.assumption.assetId} annualReturnPercent`,
      );
      const returnAmount = posted(openingBalance.times(annualReturn.div(1200)), digits);
      asset.balance = posted(Decimal.max(new D(0), openingBalance.plus(returnAmount)), digits);
      monthlySavingsReturn = monthlySavingsReturn.plus(returnAmount);
      assetRows.push({
        assetId: asset.assumption.assetId,
        name: asset.assumption.name,
        openingBalance: money(openingBalance, digits),
        savingsReturn: money(returnAmount, digits),
        contribution: money(new D(0), digits),
        withdrawal: money(new D(0), digits),
        endingBalance: money(asset.balance, digits),
      });
    }
    monthlySavingsReturn = posted(monthlySavingsReturn, digits);
    totalSavingsReturn = totalSavingsReturn.plus(monthlySavingsReturn);
    totalInterest = totalInterest.plus(interest);

    const netContribution = posted(monthlyAvailableAmount.minus(payment), digits);
    let monthlyShortfall = new D(0);
    if (netContribution.isPositive()) {
      const currentWeights = assets.map((asset) => asset.balance);
      const currentTotal = sum(currentWeights);
      const weights = currentTotal.greaterThan(0)
        ? currentWeights
        : assets.map((asset) => asset.opening);
      const fallbackTotal = sum(weights);
      const finalWeights = fallbackTotal.greaterThan(0)
        ? weights
        : assets.map(() => new D(1));
      const contributions = allocate(netContribution, assets, finalWeights, digits);
      assets.forEach((asset, index) => {
        asset.balance = posted(asset.balance.plus(contributions[index]), digits);
        assetRows[index].contribution = money(contributions[index], digits);
        assetRows[index].endingBalance = money(asset.balance, digits);
      });
    } else if (netContribution.isNegative()) {
      const amountNeeded = netContribution.abs();
      const savingsBeforeWithdrawal = sum(assets.map((asset) => asset.balance));
      const amountWithdrawn = Decimal.min(amountNeeded, savingsBeforeWithdrawal);
      const withdrawals = allocate(
        amountWithdrawn,
        assets,
        assets.map((asset) => asset.balance),
        digits,
      );
      assets.forEach((asset, index) => {
        asset.balance = posted(Decimal.max(new D(0), asset.balance.minus(withdrawals[index])), digits);
        assetRows[index].withdrawal = money(withdrawals[index], digits);
        assetRows[index].endingBalance = money(asset.balance, digits);
      });
      monthlyShortfall = posted(
        Decimal.max(new D(0), amountNeeded.minus(savingsBeforeWithdrawal)),
        digits,
      );
      totalMonthlyShortfall = totalMonthlyShortfall.plus(monthlyShortfall);
    }

    const savingsBalance = posted(sum(assets.map((asset) => asset.balance)), digits);
    const reserveBreach = savingsBalance.lessThan(emergencyReserve);
    if (reserveBreach && firstReserveBreachMonth === null) {
      firstReserveBreachMonth = month;
    }
    timeline.push({
      month,
      savingsReturn: money(monthlySavingsReturn, digits),
      loanInterest: money(interest, digits),
      loanPrincipal: money(principal, digits),
      loanPayment: money(payment, digits),
      netMonthlyContribution: money(netContribution, digits),
      monthlyFundingShortfall: money(monthlyShortfall, digits),
      savingsBalance: money(savingsBalance, digits),
      remainingLoanBalance: money(remainingLoan, digits),
      reserveBreach,
      assets: assetRows,
    });

    if (month % 12 === 0 || month === months) {
      const periodRows = timeline.slice(yearStartIndex);
      const total = (pick: (row: FinancingScenarioMonth) => string) =>
        sum(periodRows.map((row) => amount(pick(row), 'monthly result')));
      const last = periodRows[periodRows.length - 1];
      yearlyCheckpoints.push({
        year: Math.ceil(month / 12),
        fromMonth: yearStartMonth,
        toMonth: month,
        savingsReturn: money(total((row) => row.savingsReturn), digits),
        loanInterest: money(total((row) => row.loanInterest), digits),
        loanPrincipal: money(total((row) => row.loanPrincipal), digits),
        loanPayments: money(total((row) => row.loanPayment), digits),
        netMonthlyContributions: money(total((row) => row.netMonthlyContribution), digits),
        fundingShortfall: money(total((row) => row.monthlyFundingShortfall), digits),
        endingSavingsBalance: last.savingsBalance,
        remainingLoanBalance: last.remainingLoanBalance,
        reserveBreach: periodRows.some((row) => row.reserveBreach),
      });
      yearStartMonth = month + 1;
      yearStartIndex = timeline.length;
    }
  }

  const savingsReturn = posted(totalSavingsReturn, digits);
  const monthlyShortfall = posted(totalMonthlyShortfall, digits);
  const finalBalance = posted(sum(assets.map((asset) => asset.balance)), digits);
  const totalShortfall = posted(initialFundingShortfall.plus(monthlyShortfall), digits);
  const financingCost = posted(
    totalInterest.plus(option.optionFee).plus(option.optionInsuranceFee),
    digits,
  );
  return {
    type,
    purchasePrice: money(purchasePrice, digits),
    downPayment: money(option.downPayment, digits),
    initialOutlay: money(option.outlay, digits),
    loanPrincipal: money(option.principal, digits),
    loanSetupFee: money(option.optionFee, digits),
    insuranceFee: money(option.optionInsuranceFee, digits),
    scheduledMonthlyPayment: money(scheduledPayment, digits),
    financingCost: money(financingCost, digits),
    savingsReturn: money(savingsReturn, digits),
    savingsReturnDifference: money(new D(0), digits),
    finalScenarioSavingsBalance: money(finalBalance, digits),
    reserveBreach: firstReserveBreachMonth !== null,
    firstReserveBreachMonth,
    emergencyReserveAtRisk: firstReserveBreachMonth !== null,
    initialFundingShortfall: money(initialFundingShortfall, digits),
    monthlyFundingShortfall: money(monthlyShortfall, digits),
    totalFundingShortfall: money(totalShortfall, digits),
    status: 'COMPLETE',
    timeline,
    yearlyCheckpoints,
  };
}

export function calculateFinancingScenario(
  inputs: FinancingScenarioInputs,
  currency = 'EUR',
): FinancingScenarioCalculation {
  const digits = validate(inputs, currency);
  const purchasePrice = posted(amount(inputs.purchasePrice, 'purchasePrice'), digits);
  const customDownPayment = posted(amount(inputs.customDownPayment, 'customDownPayment'), digits);
  const emergencyReserve = posted(amount(inputs.emergencyReserve, 'emergencyReserve'), digits);
  const monthlyAvailableAmount = posted(
    amount(inputs.monthlyAvailableAmount, 'monthlyAvailableAmount'),
    digits,
  );
  const annualLoanRate = amount(inputs.loanRatePercent, 'loanRatePercent');
  const insuranceFeePercent = amount(inputs.insuranceFeePercent, 'insuranceFeePercent');
  const setupFee = posted(amount(inputs.loanSetupFee, 'loanSetupFee'), digits);
  const eligibleSourceAssets = inputs.assets.filter((asset) => asset.available);
  const eligibleStartingSavings = sum(
    eligibleSourceAssets.map((asset) => posted(amount(asset.balance, 'asset balance'), digits)),
  );
  const eligibleAssets: FinancingAssetAssumption[] = eligibleSourceAssets.map((asset) => ({
    assetId: asset.assetId,
    name: asset.name,
    startingBalance: money(amount(asset.balance, 'asset balance'), digits),
    annualReturnPercent: amount(asset.annualReturnPercent, 'asset annual return').toString(),
  }));
  const common = {
    currency,
    startingSavings: money(eligibleStartingSavings, digits),
    emergencyReserve: money(emergencyReserve, digits),
    monthlyAvailableAmount: money(monthlyAvailableAmount, digits),
    financingHorizonMonths: inputs.loanDurationMonths,
    loanRatePercent: annualLoanRate.toString(),
    loanSetupFee: money(setupFee, digits),
    withdrawalRule: 'PROPORTIONAL_BY_CURRENT_BALANCE' as const,
    positiveContributionRule:
      'PROPORTIONAL_BY_CURRENT_BALANCE_THEN_STARTING_BALANCE_THEN_EQUAL' as const,
    eligibleAssets,
  };

  if (eligibleSourceAssets.length === 0) {
    return { ...common, status: 'NO_ELIGIBLE_ASSETS', options: [] };
  }

  const options = (['CASH', 'CUSTOM_DOWN_PAYMENT', 'FULL'] as const).map((type) =>
    createOption(
      type,
      digits,
      inputs.loanDurationMonths,
      purchasePrice,
      customDownPayment,
      emergencyReserve,
      monthlyAvailableAmount,
      annualLoanRate,
      insuranceFeePercent,
      setupFee,
      eligibleSourceAssets,
    ),
  );
  const cashSavingsReturn = amount(options[0].savingsReturn, 'cash savings return');
  for (const option of options) {
    option.savingsReturnDifference = money(
      amount(option.savingsReturn, 'savings return').minus(cashSavingsReturn),
      digits,
    );
  }
  return { ...common, status: 'COMPLETE', options };
}
