import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AssetTypeGroup } from '@prisma/client';

export class UpdateAssetTypeDto {
  @ApiProperty({ description: 'Human-readable label' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ enum: AssetTypeGroup, description: 'Asset type group' })
  @IsEnum(AssetTypeGroup)
  group!: AssetTypeGroup;
}
