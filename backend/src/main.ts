import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { execFileSync } from 'child_process';
import * as path from 'path';
import { AppModule } from './app.module.js';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:6543', 'tauri://localhost'];

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

async function bootstrap() {
  console.log('⚙️  Running database migrations...');
  try {
    // Use process.execPath (absolute node binary path) + the local prisma
    // script so this works when PATH is stripped — e.g. when spawned as a
    // child process by the Tauri desktop app launched from /Applications.
    const prismaJs = path.join(
      __dirname,
      '..',
      'node_modules',
      'prisma',
      'build',
      'index.js',
    );
    execFileSync(process.execPath, [prismaJs, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch {
    console.error('❌ Database migration failed. Exiting.');
    process.exit(1);
  }

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableCors({
    origin: parseAllowedOrigins(),
    credentials: true,
  });

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
