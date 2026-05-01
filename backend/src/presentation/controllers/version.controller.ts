import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { getVersionInfo } from '../../version.js';
import type { VersionInfo } from '../../version.js';

@ApiTags('System')
@Controller('api/v1/version')
export class VersionController {
  @Get()
  @ApiOperation({
    summary: 'Build version + environment (derived from git describe)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        version: '1.2.3',
        env: 'production',
        gitSha: 'abc1234',
        buildTime: '2026-02-08T12:00:00.000Z',
      },
    },
  })
  get(): VersionInfo {
    return getVersionInfo();
  }
}
