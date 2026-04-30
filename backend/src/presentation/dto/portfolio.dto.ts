import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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

export class UpdatePortfolioDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  baseCurrency?: string;
}
