import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortfolioSnapshotResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: 'Total portfolio value as decimal string' })
  value!: string;
  @ApiProperty({ description: 'Currency code', example: 'EUR' })
  currency!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  notes!: string | null;
  @ApiProperty({ description: 'Observation date (ISO 8601)' })
  observedAt!: string;
  @ApiProperty() createdAt!: string;
}
