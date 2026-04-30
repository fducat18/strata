import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/** Payload to create a new Portfolio. */
export class CreatePortfolioDto {
  @ApiProperty({ description: 'Name of the portfolio' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Base currency code (e.g. EUR, USD)' })
  @IsString()
  @IsNotEmpty()
  baseCurrency!: string;
}
