import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsISO8601 } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

export class UpdateAssetSnapshotDto {
  @ApiPropertyOptional({ description: 'New value of the asset snapshot', example: '250000.00' })
  @IsOptional()
  @IsDecimalString({ maxFractionDigits: 2 })
  value?: string;

  @ApiPropertyOptional({ description: 'New observed date (ISO 8601)', example: '2025-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;
}
