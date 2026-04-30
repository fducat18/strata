import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  async check(): Promise<{ status: string; db: string; version: string }> {
    let db = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    return { status: 'ok', db, version: pkg.version };
  }
}
