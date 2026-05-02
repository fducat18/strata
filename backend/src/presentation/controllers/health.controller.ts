import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../../package.json') as { version: string };

@ApiTags('Health')
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + DB readiness probe' })
  @ApiResponse({
    status: 200,
    schema: {
      example: { status: 'ok', db: 'up', version: '0.0.1' },
    },
  })
  @ApiResponse({ status: 503, description: 'Service unavailable — DB is down' })
  async check(
    @Res({ passthrough: true }) res?: Response,
  ): Promise<{ status: string; db: string; version: string }> {
    let db = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    if (db === 'down') {
      res?.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: 'ok', db, version: pkg.version };
  }
}
