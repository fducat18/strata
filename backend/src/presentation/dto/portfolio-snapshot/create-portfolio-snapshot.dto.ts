import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsISO8601, Length, Matches } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

export class CreatePortfolioSnapshotDto {
  @ApiPropertyOptional({
    description:
      'Portfolio value as decimal string. If omitted, computed automatically from active asset snapshots.',
    example: '239200.00',
  })
  @IsOptional()
  @IsDecimalString({ maxFractionDigits: 2 })
  value?: string;

  @ApiPropertyOptional({
    description: 'Currency code (default: EUR). Must be a 3-letter ISO 4217 code.',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code (e.g. EUR, USD)',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Optional notes about this snapshot',
    example: 'End of Q1 2025',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Observation date (ISO 8601). Defaults to now if not provided.',
    example: '2025-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;
}
