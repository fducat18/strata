import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module.js';

export interface E2ETestContext {
  app: INestApplication;
  tempDir: string;
  dbUrl: string;
  cleanup: () => Promise<void>;
}

/**
 * Bootstraps a NestJS app backed by a fresh per-suite SQLite database.
 *
 * - mkdtemp → DATABASE_URL=file:<dir>/test.db
 * - prisma migrate deploy + (optional) seed
 * - disposes the app and removes the temp dir on cleanup()
 *
 * Sets process.env.DATABASE_URL BEFORE module init so PrismaClient
 * picks it up.
 */
export async function createIsolatedE2EApp(opts?: {
  seed?: boolean;
  seedDemo?: boolean;
}): Promise<E2ETestContext> {
  const tempDir = mkdtempSync(join(tmpdir(), 'strata-e2e-'));
  const dbPath = join(tempDir, 'test.db');
  const dbUrl = `file:${dbPath}`;

  process.env.DATABASE_URL = dbUrl;

  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..', '..'),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'pipe',
  });

  if (opts?.seed) {
    execSync('npx prisma db seed', {
      cwd: join(__dirname, '..', '..'),
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        SEED_DEMO_DATA: opts.seedDemo ? 'true' : 'false',
      },
      stdio: 'pipe',
    });
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  await app.init();

  const cleanup = async (): Promise<void> => {
    await app.close();
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  };

  return { app, tempDir, dbUrl, cleanup };
}
