import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

export class DisposeAssetDto {
  @ApiProperty({ description: 'Disposal date (ISO 8601)', example: '2025-06-01' })
  @IsDateString()
  disposalDate!: string;

  @ApiProperty({ description: 'Disposal price in EUR', example: '5000.00' })
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  disposalPrice!: string;
}
