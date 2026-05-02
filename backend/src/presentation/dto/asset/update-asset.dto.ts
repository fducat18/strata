import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, IsDateString } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

/** Payload to update mutable fields of an Asset. */
export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Quantity as decimal string (max 8 fractional digits)',
  })
  @IsOptional()
  @IsDecimalString({ maxFractionDigits: 8 })
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetTypeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;
}
