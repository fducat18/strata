import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { execSync } from 'child_process';
import { AppModule } from './app.module.js';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:4321', 'tauri://localhost'];

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

function shouldEnableSwagger(): boolean {
  return process.env.ENABLE_SWAGGER !== 'false';
}

async function bootstrap() {
  const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVersion !== 22) {
    console.error(
      `\n❌  Wrong Node.js version: v${process.versions.node}\n` +
        `    Strata requires Node 22.\n` +
        `    Fix: nvm use 22  →  then: npm install\n`,
    );
    process.exit(1);
  }

  console.log('⚙️  Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', {
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

  if (shouldEnableSwagger()) {
    const config = new DocumentBuilder()
      .setTitle('Strata API')
      .setDescription(
        'Universal asset tracking API — manage assets, snapshots, categories, and tags.',
      )
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Strata API running on http://localhost:${String(port)}`);
  if (shouldEnableSwagger()) {
    logger.log(`📖 Swagger UI at http://localhost:${String(port)}/swagger`);
  }
}
void bootstrap();
