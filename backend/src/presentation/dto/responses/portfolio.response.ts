import { ApiProperty } from '@nestjs/swagger';

export class PortfolioResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() baseCurrency!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ description: 'Total portfolio value as decimal string' })
  totalValue!: string;
}
