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

export class FinancingScenario {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly currency: string,
    public readonly inputs: FinancingScenarioInputs,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
