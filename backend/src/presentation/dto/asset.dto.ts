import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ description: 'Name of the asset' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolioId!: string;

  @ApiProperty({ description: 'Asset type ID' })
  @IsUUID()
  assetTypeId!: string;

  @ApiPropertyOptional({ description: 'Quantity (decimal string)' })
  @IsOptional()
  @IsString()
  quantity?: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetTypeId?: string;
}
