import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  MaxLength,
  MinLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';
import { FinancingScenarioAssetDto } from './financing-scenario-asset.dto.js';

export class CreateFinancingScenarioDto {
  @ApiProperty({ example: 'Compare car financing' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '10000.00', description: 'Purchase Price in EUR.' })
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  purchasePrice!: string;

  @ApiProperty({ example: '5000.00', description: 'Custom partial Down Payment in EUR.' })
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  customDownPayment!: string;

  @ApiProperty({ example: '10000.00', description: 'Emergency Reserve warning threshold in EUR.' })
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  emergencyReserve!: string;

  @ApiProperty({ example: '1000.00', description: 'Fixed monthly amount available in EUR.' })
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  monthlyAvailableAmount!: string;

  @ApiProperty({ example: '8', description: 'Annual Loan Rate Assumption, expressed as a percentage.' })
  @IsDecimalString({ maxIntDigits: 4, maxFractionDigits: 6, allowNegative: false })
  loanRatePercent!: string;

  @ApiPropertyOptional({
    example: '0.5',
    description: 'Optional one-time insurance fee percentage of purchase price for loan options (defaults to zero).',
  })
  @IsOptional()
  @IsDecimalString({ maxIntDigits: 4, maxFractionDigits: 6, allowNegative: false })
  insuranceFeePercent?: string;

  @ApiProperty({
    example: 60,
    description: 'Standard Loan duration and shared Financing Horizon in months (maximum 1200).',
  })
  @IsInt()
  @Min(1)
  @Max(1200)
  loanDurationMonths!: number;

  @ApiPropertyOptional({ example: '0.00', description: 'Optional Loan Setup Fee paid up front from savings (defaults to zero).' })
  @IsOptional()
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  loanSetupFee?: string;

  @ApiProperty({
    type: [FinancingScenarioAssetDto],
    description: 'Assets shown to the user, with explicit availability and individual annual return assumptions.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancingScenarioAssetDto)
  assets!: FinancingScenarioAssetDto[];
}
