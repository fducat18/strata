import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetTypeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() label!: string;
}

export class PortfolioNestedResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() baseCurrency!: string;
}

export class CategoryNestedResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  parentId!: string | null;
}

export class TagNestedResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

export class AssetSnapshotNestedResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() value!: string;
  @ApiProperty() observedAt!: string;
}

export class AssetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  quantity!: string | null;
  @ApiProperty() disposed!: boolean;
  @ApiProperty() portfolioId!: string;
  @ApiProperty() assetTypeId!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ type: AssetTypeResponseDto, nullable: true })
  assetType!: AssetTypeResponseDto | null;
  @ApiPropertyOptional({ type: PortfolioNestedResponseDto, nullable: true })
  portfolio!: PortfolioNestedResponseDto | null;
  @ApiProperty({ type: [CategoryNestedResponseDto] })
  categories!: CategoryNestedResponseDto[];
  @ApiProperty({ type: [TagNestedResponseDto] })
  tags!: TagNestedResponseDto[];
}
