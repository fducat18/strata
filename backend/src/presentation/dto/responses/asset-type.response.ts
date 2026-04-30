import { ApiProperty } from '@nestjs/swagger';

export class AssetTypeFullResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() label!: string;
}
