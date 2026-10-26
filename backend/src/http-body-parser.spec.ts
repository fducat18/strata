import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureBodyParsers } from './http-body-parser.js';

describe('configureBodyParsers', () => {
  it('sets a bounded JSON parser and preserves URL-encoded parsing', () => {
    const app = {
      useBodyParser: jest.fn().mockReturnThis(),
    } satisfies Pick<NestExpressApplication, 'useBodyParser'>;

    configureBodyParsers(app);

    expect(app.useBodyParser).toHaveBeenNthCalledWith(1, 'json', {
      limit: '10mb',
    });
    expect(app.useBodyParser).toHaveBeenNthCalledWith(2, 'urlencoded', {
      extended: true,
    });
  });
});
