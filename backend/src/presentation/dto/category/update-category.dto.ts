import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Real Estate' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
