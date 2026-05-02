import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @ApiProperty({ example: 'high-yield' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;
}
