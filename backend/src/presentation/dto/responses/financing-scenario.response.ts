import { ApiProperty } from '@nestjs/swagger';

export class FinancingScenarioAssetInputResponseDto {
  @ApiProperty() assetId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() balance!: string;
  @ApiProperty() available!: boolean;
  @ApiProperty() annualReturnPercent!: string;
}

export class FinancingScenarioInputsResponseDto {
  @ApiProperty() purchasePrice!: string;
  @ApiProperty() customDownPayment!: string;
  @ApiProperty() emergencyReserve!: string;
  @ApiProperty() monthlyAvailableAmount!: string;
  @ApiProperty() loanRatePercent!: string;
  @ApiProperty() insuranceFeePercent!: string;
  @ApiProperty() loanDurationMonths!: number;
  @ApiProperty() loanSetupFee!: string;
  @ApiProperty({ type: [FinancingScenarioAssetInputResponseDto] })
  assets!: FinancingScenarioAssetInputResponseDto[];
}

export class FinancingScenarioEligibleAssetResponseDto {
  @ApiProperty() assetId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() startingBalance!: string;
  @ApiProperty() annualReturnPercent!: string;
}

export class FinancingScenarioAssetMonthResponseDto {
  @ApiProperty() assetId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() openingBalance!: string;
  @ApiProperty() savingsReturn!: string;
  @ApiProperty() contribution!: string;
  @ApiProperty() withdrawal!: string;
  @ApiProperty() endingBalance!: string;
}

export class FinancingScenarioMonthResponseDto {
  @ApiProperty() month!: number;
  @ApiProperty() savingsReturn!: string;
  @ApiProperty() loanInterest!: string;
  @ApiProperty() loanPrincipal!: string;
  @ApiProperty() loanPayment!: string;
  @ApiProperty() netMonthlyContribution!: string;
  @ApiProperty() monthlyFundingShortfall!: string;
  @ApiProperty() savingsBalance!: string;
  @ApiProperty() remainingLoanBalance!: string;
  @ApiProperty() reserveBreach!: boolean;
  @ApiProperty({ type: [FinancingScenarioAssetMonthResponseDto] })
  assets!: FinancingScenarioAssetMonthResponseDto[];
}

export class FinancingYearCheckpointResponseDto {
  @ApiProperty() year!: number;
  @ApiProperty() fromMonth!: number;
  @ApiProperty() toMonth!: number;
  @ApiProperty() savingsReturn!: string;
  @ApiProperty() loanInterest!: string;
  @ApiProperty() loanPrincipal!: string;
  @ApiProperty() loanPayments!: string;
  @ApiProperty() netMonthlyContributions!: string;
  @ApiProperty() fundingShortfall!: string;
  @ApiProperty() endingSavingsBalance!: string;
  @ApiProperty() remainingLoanBalance!: string;
  @ApiProperty() reserveBreach!: boolean;
}

export class FinancingOptionResponseDto {
  @ApiProperty({ enum: ['CASH', 'CUSTOM_DOWN_PAYMENT', 'FULL'] }) type!: string;
  @ApiProperty() purchasePrice!: string;
  @ApiProperty() downPayment!: string;
  @ApiProperty() initialOutlay!: string;
  @ApiProperty() loanPrincipal!: string;
  @ApiProperty() loanSetupFee!: string;
  @ApiProperty() insuranceFee!: string;
  @ApiProperty() scheduledMonthlyPayment!: string;
  @ApiProperty() financingCost!: string;
  @ApiProperty() savingsReturn!: string;
  @ApiProperty() savingsReturnDifference!: string;
  @ApiProperty() finalScenarioSavingsBalance!: string;
  @ApiProperty() reserveBreach!: boolean;
  @ApiProperty({ oneOf: [{ type: 'string', enum: ['initial'] }, { type: 'integer' }], nullable: true })
  firstReserveBreachMonth!: 'initial' | number | null;
  @ApiProperty() emergencyReserveAtRisk!: boolean;
  @ApiProperty() initialFundingShortfall!: string;
  @ApiProperty() monthlyFundingShortfall!: string;
  @ApiProperty() totalFundingShortfall!: string;
  @ApiProperty({ enum: ['COMPLETE', 'NO_ELIGIBLE_ASSETS'] }) status!: string;
  @ApiProperty({ type: [FinancingScenarioMonthResponseDto] })
  timeline!: FinancingScenarioMonthResponseDto[];
  @ApiProperty({ type: [FinancingYearCheckpointResponseDto] })
  yearlyCheckpoints!: FinancingYearCheckpointResponseDto[];
}

export class FinancingCalculationResponseDto {
  @ApiProperty({ enum: ['COMPLETE', 'NO_ELIGIBLE_ASSETS'] }) status!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() startingSavings!: string;
  @ApiProperty() emergencyReserve!: string;
  @ApiProperty() monthlyAvailableAmount!: string;
  @ApiProperty() financingHorizonMonths!: number;
  @ApiProperty() loanRatePercent!: string;
  @ApiProperty() loanSetupFee!: string;
  @ApiProperty({ enum: ['PROPORTIONAL_BY_CURRENT_BALANCE'] }) withdrawalRule!: string;
  @ApiProperty() positiveContributionRule!: string;
  @ApiProperty({ type: [FinancingScenarioEligibleAssetResponseDto] })
  eligibleAssets!: FinancingScenarioEligibleAssetResponseDto[];
  @ApiProperty({ type: [FinancingOptionResponseDto] })
  options!: FinancingOptionResponseDto[];
}

export class FinancingScenarioResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() currency!: string;
  @ApiProperty({ type: FinancingScenarioInputsResponseDto })
  inputs!: FinancingScenarioInputsResponseDto;
  @ApiProperty({ type: FinancingCalculationResponseDto })
  calculation!: FinancingCalculationResponseDto;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
