import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
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
  if (process.env.ENABLE_SWAGGER === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

async function bootstrap() {
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
        'Universal asset tracking API — manage portfolios, assets, snapshots, categories, and tags.',
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
