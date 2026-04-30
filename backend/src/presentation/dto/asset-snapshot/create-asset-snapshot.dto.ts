import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsISO8601 } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

/** Payload to record an AssetSnapshot at a specific moment in time. */
export class CreateAssetSnapshotDto {
  @ApiProperty({
    description: 'Value as decimal string (max 2 fractional digits — money)',
    example: '1234.56',
  })
  @IsNotEmpty()
  @IsDecimalString({ maxFractionDigits: 2 })
  value!: string;

  @ApiProperty({ description: 'Observation date (ISO 8601)' })
  @IsISO8601()
  observedAt!: string;
}
