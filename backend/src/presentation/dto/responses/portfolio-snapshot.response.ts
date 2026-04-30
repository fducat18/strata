import { ApiProperty } from '@nestjs/swagger';

export class PortfolioSnapshotResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() portfolioId!: string;
  @ApiProperty({ description: 'Value as decimal string' }) value!: string;
  @ApiProperty({ description: 'Observation date (ISO 8601)' })
  observedAt!: string;
  @ApiProperty() createdAt!: string;
}
