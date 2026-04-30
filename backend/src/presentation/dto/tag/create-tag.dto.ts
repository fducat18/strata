import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/** Payload to create a new Tag. */
export class CreateTagDto {
  @ApiProperty({ description: 'Name of the tag' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
