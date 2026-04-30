import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

export class CreateAssetSnapshotDto {
  @ApiProperty({ description: 'Value as decimal string' })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({ description: 'Observation date (ISO 8601)' })
  @IsISO8601()
  observedAt!: string;
}
