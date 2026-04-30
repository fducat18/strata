import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  parentId!: string | null;
  @ApiProperty({ type: () => [CategoryResponseDto] })
  children!: CategoryResponseDto[];
}
