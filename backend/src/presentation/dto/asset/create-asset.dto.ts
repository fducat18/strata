import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

/** Payload to create a new Asset. */
export class CreateAssetDto {
  @ApiProperty({ description: 'Name of the asset' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Asset type ID' })
  @IsUUID()
  assetTypeId!: string;

  @ApiPropertyOptional({
    description: 'Quantity as decimal string (max 8 fractional digits)',
    example: '0.12345678',
  })
  @IsOptional()
  @IsDecimalString({ maxFractionDigits: 8 })
  quantity?: string;

  @ApiProperty({ description: 'Acquisition date (ISO 8601)', example: '2025-01-15' })
  @IsDateString()
  acquisitionDate!: string;

  @ApiProperty({ description: 'Acquisition price in EUR', example: '10000.00' })
  @IsDecimalString({ maxFractionDigits: 2, allowNegative: false })
  acquisitionPrice!: string;
}
