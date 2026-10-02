import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { AppModule } from './app.module.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:6543',    // Astro dev frontend
  'http://127.0.0.1:6543',    // Astro dev (127.0.0.1 variant)
  'http://127.0.0.1:1430',    // Tauri dev frontend
  'tauri://localhost',        // Tauri production
];

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

function createCorsMiddleware(allowedOrigins: string[], allowedPrefixes: string[] = []) {
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    const isAllowed = origin && (
      allowedOrigins.includes(origin) ||
      allowedPrefixes.some((prefix) => origin.startsWith(prefix))
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID,X-Strata-Desktop-Token');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      return res.sendStatus(204);
    }

    // Handle actual requests
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    next();
  };
}

function resolvePrismaCliPath(baseDir: string): string {
  const prismaDir = path.join(baseDir, 'node_modules', 'prisma');
  const packageJsonPath = path.join(prismaDir, 'package.json');
  const candidates: string[] = [];

  if (existsSync(packageJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        bin?: string | { prisma?: string } | Record<string, string>;
      };
      const bin =
        typeof parsed.bin === 'string'
          ? parsed.bin
          : parsed.bin?.prisma ?? Object.values(parsed.bin ?? {})[0];
      if (typeof bin === 'string' && bin.trim().length > 0) {
        candidates.push(path.join(prismaDir, bin.replace(/^\.?\//u, '')));
      }
    } catch {
      // Fall through to static candidates below.
    }
  }

  for (const rel of ['build/index.js', 'dist/cli/src/bin.js', 'dist/index.js']) {
    const candidate = path.join(prismaDir, rel);
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error(`prisma CLI not found. Checked: ${candidates.join(', ')}`);
  }
  return resolved;
}

async function bootstrap() {
  console.log('⚙️  Running database migrations...');
  try {
    // Use process.execPath (absolute node binary path) + the local prisma
    // script so this works when PATH is stripped — e.g. when spawned as a
    // child process by the Tauri desktop app launched from /Applications.
    const prismaJs = resolvePrismaCliPath(path.join(__dirname, '..'));
    execFileSync(process.execPath, [prismaJs, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (error) {
    console.error('❌ Database migration failed. Exiting.');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = parseAllowedOrigins();
  // In dev (Tauri dev server), the port is dynamic (1430, 1431, …) — allow any 127.0.0.1 origin
  const allowedPrefixes = allowedOrigins.includes('http://127.0.0.1:1430')
    ? ['http://127.0.0.1:']
    : [];
  app.use(createCorsMiddleware(allowedOrigins, allowedPrefixes));

  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Strata API')
    .setDescription(
      'Universal asset tracking API — manage assets, snapshots, categories, and tags.',
    )
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Strata API running on http://localhost:${String(port)}`);
  logger.log(`📖 Swagger UI at http://localhost:${String(port)}/swagger`);
}
void bootstrap();
