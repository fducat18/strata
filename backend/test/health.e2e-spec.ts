import request from 'supertest';
import { App } from 'supertest/types';
import {
  createIsolatedE2EApp,
  E2ETestContext,
} from './helpers/e2e-setup.js';

describe('Health (e2e)', () => {
  let ctx: E2ETestContext;

  beforeAll(async () => {
    ctx = await createIsolatedE2EApp({ seed: true });
  }, 60_000);

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('GET /api/v1/health → 200 with status/db/version', async () => {
    const res = await request(ctx.app.getHttpServer() as unknown as App)
      .get('/api/v1/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(typeof res.body.version).toBe('string');
  });

  it('echoes a request id', async () => {
    const res = await request(ctx.app.getHttpServer() as unknown as App)
      .get('/api/v1/health')
      .set('X-Request-Id', 'abc-123-fixed')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('abc-123-fixed');
  });

  it('generates a request id when none is provided', async () => {
    const res = await request(ctx.app.getHttpServer() as unknown as App)
      .get('/api/v1/health')
      .expect(200);
    expect(res.headers['x-request-id']).toMatch(/[0-9a-f-]{36}/);
  });
});
