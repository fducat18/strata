import { Body, Controller, Get, Post, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import {
  BackupService,
  BackupPayload,
  RestoreCounts,
} from '../../application/services/backup/index.js';
import { RestoreBackupDto } from '../dto/index.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';

@ApiTags('Admin')
@Controller('api/v1/admin')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class AdminController {
  constructor(private readonly backupService: BackupService) {}

  @Get('backup')
  @ApiOperation({
    summary: 'Export full database as a versioned JSON document.',
    description:
      'Returns { schemaVersion, exportedAt, data: { ... entity tables ... } }.\n' +
      'Decimal values are serialized as strings, dates as ISO 8601.',
  })
  @ApiResponse({ status: 200, description: 'JSON backup payload' })
  async exportBackup(): Promise<BackupPayload> {
    return this.backupService.exportBackup();
  }

  @Post('restore')
  @ApiOperation({
    summary: 'Restore (replace or merge) the database from a backup payload.',
  })
  @ApiBody({ type: RestoreBackupDto })
  @ApiResponse({
    status: 201,
    description: 'Insertion counts per entity.',
    schema: {
      example: {
        schemaVersion: '1',
        mode: 'replace',
        counts: {
          assetTypes: 13,
          categories: 5,
          tags: 3,
          assets: 6,
          assetSnapshots: 6,
          portfolioSnapshots: 4,
          transactions: 6,
          categoriesOnAssets: 6,
          tagsOnAssets: 8,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or unsupported payload' })
  async restoreBackup(@Body() dto: RestoreBackupDto): Promise<RestoreCounts> {
    return this.backupService.importBackup({
      schemaVersion: dto.schemaVersion,
      data: dto.data,
      mode: dto.mode,
    });
  }
}
