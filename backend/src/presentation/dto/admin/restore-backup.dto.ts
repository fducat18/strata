import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsOptional,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

/** Modes for /admin/restore: replace wipes existing data, merge upserts. */
export type RestoreMode = 'replace' | 'merge';

export class RestoreBackupDto {
  @ApiProperty({ description: 'Schema version of the backup payload.' })
  @IsString()
  @IsNotEmpty()
  schemaVersion!: string;

  @ApiProperty({
    description: 'Entity tables. See GET /admin/backup for the shape.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'replace (default) wipes existing data; merge upserts.',
    enum: ['replace', 'merge'],
  })
  @IsOptional()
  @IsIn(['replace', 'merge'])
  mode?: RestoreMode;
}
