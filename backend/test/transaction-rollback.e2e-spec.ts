import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service.js';
import { createIsolatedE2EApp, E2ETestContext } from './helpers/e2e-setup.js';

/**
 * Asserts compound writes are wrapped in $transaction.
 *
 * Trigger: try to attach the SAME tag twice. The second create violates
 * the (assetId, tagId) primary key → P2002 → 409. Crucially, the failed
 * second call must not have any side-effect (no orphan rows).
 */
describe('Transaction rollback on association failure (e2e)', () => {
  let ctx: E2ETestContext;

  beforeAll(async () => {
    ctx = await createIsolatedE2EApp({ seed: true });
  }, 60_000);

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('partial-failure on add-tag does not create orphan join rows', async () => {
    const http = ctx.app.getHttpServer() as unknown as App;
    const prisma = ctx.app.get(PrismaService);
    const types = await request(http).get('/api/v1/asset-types').expect(200);
    const assetTypeId = types.body[0].id;

    const a = await request(http)
      .post('/api/v1/assets')
      .send({ name: `Tx-${Date.now()}`, assetTypeId, acquisitionDate: '2025-01-01', acquisitionPrice: '1000.00' })
      .expect(201);

    const t = await request(http)
      .post('/api/v1/tags')
      .send({ name: `tx-tag-${Date.now()}` })
      .expect(201);

    await request(http)
      .post(`/api/v1/assets/${a.body.id}/tags/${t.body.id}`)
      .expect(201);

    // Second attempt — must be rejected and must not leave duplicate rows.
    await request(http)
      .post(`/api/v1/assets/${a.body.id}/tags/${t.body.id}`)
      .expect(409);

    const links = await prisma.tagsOnAssets.count({
      where: { assetId: a.body.id, tagId: t.body.id },
    });
    expect(links).toBe(1);
  });

  it('attaching a non-existent tag returns 404 and creates no rows', async () => {
    const http = ctx.app.getHttpServer() as unknown as App;
    const prisma = ctx.app.get(PrismaService);
    const types = await request(http).get('/api/v1/asset-types').expect(200);
    const assetTypeId = types.body[0].id;

    const a = await request(http)
      .post('/api/v1/assets')
      .send({ name: `Tx2-${Date.now()}`, assetTypeId, acquisitionDate: '2025-01-01', acquisitionPrice: '1000.00' })
      .expect(201);

    await request(http)
      .post(
        `/api/v1/assets/${a.body.id}/tags/00000000-0000-0000-0000-000000000000`,
      )
      .expect(404);

    expect(
      await prisma.tagsOnAssets.count({ where: { assetId: a.body.id } }),
    ).toBe(0);
  });
});
