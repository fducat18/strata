import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsUUID } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

export class FinancingScenarioAssetDto {
  @ApiProperty({ description: 'Existing Strata asset used as a balance source.' })
  @IsUUID()
  assetId!: string;

  @ApiProperty({
    description: 'Explicit user confirmation that this SAVINGS-group asset is available for this purchase.',
  })
  @IsBoolean()
  available!: boolean;

  @ApiProperty({
    description: 'Constant annual Savings Return Assumption, expressed as a percentage.',
    example: '5',
  })
  @IsString()
  @IsDecimalString({ maxIntDigits: 4, maxFractionDigits: 6, allowNegative: true })
  annualReturnPercent!: string;
}
