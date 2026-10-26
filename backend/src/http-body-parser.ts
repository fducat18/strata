import type { NestExpressApplication } from '@nestjs/platform-express';

export function configureBodyParsers(
  app: Pick<NestExpressApplication, 'useBodyParser'>,
): void {
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { extended: true });
}
