import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AssetTypeGroup } from '@prisma/client';

export class CreateAssetTypeDto {
  @ApiProperty({ description: 'Unique code for the asset type, e.g. CRYPTO_ETF' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'Human-readable label, e.g. Crypto ETF' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ enum: AssetTypeGroup, description: 'Asset type group' })
  @IsEnum(AssetTypeGroup)
  group!: AssetTypeGroup;
}
