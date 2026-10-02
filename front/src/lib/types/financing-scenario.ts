export type FinancingOptionType = 'CASH' | 'CUSTOM_DOWN_PAYMENT' | 'FULL';
export type FinancingCalculationStatus = 'COMPLETE' | 'NO_ELIGIBLE_ASSETS';

export interface FinancingScenarioAssetRequest {
  assetId: string;
  available: boolean;
  annualReturnPercent: string;
}

export interface SaveFinancingScenarioRequest {
  name: string;
  purchasePrice: string;
  customDownPayment: string;
  emergencyReserve: string;
  monthlyAvailableAmount: string;
  loanRatePercent: string;
  insuranceFeePercent: string;
  loanDurationMonths: number;
  loanSetupFee?: string;
  assets: FinancingScenarioAssetRequest[];
}

export interface FinancingScenarioAssetInput {
  assetId: string;
  name: string;
  balance: string;
  available: boolean;
  annualReturnPercent: string;
}

export interface FinancingScenarioInputs {
  purchasePrice: string;
  customDownPayment: string;
  emergencyReserve: string;
  monthlyAvailableAmount: string;
  loanRatePercent: string;
  insuranceFeePercent: string;
  loanDurationMonths: number;
  loanSetupFee: string;
  assets: FinancingScenarioAssetInput[];
}

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
  withdrawalRule: string;
  positiveContributionRule: string;
  eligibleAssets: FinancingAssetAssumption[];
  options: FinancingOptionResult[];
}

export interface FinancingScenario {
  id: string;
  name: string;
  currency: string;
  inputs: FinancingScenarioInputs;
  calculation: FinancingScenarioCalculation;
  createdAt: string;
  updatedAt: string;
}
