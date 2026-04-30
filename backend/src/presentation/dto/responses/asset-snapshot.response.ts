import { ApiProperty } from '@nestjs/swagger';

export class AssetSnapshotResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() assetId!: string;
  @ApiProperty({ description: 'Value as decimal string' }) value!: string;
  @ApiProperty({ description: 'Observation date (ISO 8601)' })
  observedAt!: string;
  @ApiProperty() createdAt!: string;
}
