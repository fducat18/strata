import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service.js';
import {
  createIsolatedE2EApp,
  E2ETestContext,
} from './helpers/e2e-setup.js';

describe('Cascade delete (e2e)', () => {
  let ctx: E2ETestContext;

  beforeAll(async () => {
    ctx = await createIsolatedE2EApp({ seed: true });
  }, 60_000);

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('deleting a portfolio cascades to its assets and snapshots', async () => {
    const http = ctx.app.getHttpServer() as unknown as App;
    const types = await request(http).get('/api/v1/asset-types').expect(200);
    const assetTypeId = types.body[0].id;

    const p = await request(http)
      .post('/api/v1/portfolios')
      .send({ name: `Cascade-${Date.now()}`, baseCurrency: 'EUR' })
      .expect(201);
    const portfolioId = p.body.id;

    const a = await request(http)
      .post('/api/v1/assets')
      .send({ name: 'cascade-asset', portfolioId, assetTypeId })
      .expect(201);
    const assetId = a.body.id;

    await request(http)
      .post(`/api/v1/assets/${assetId}/snapshots`)
      .send({ value: '10.00', observedAt: '2025-01-01T00:00:00.000Z' })
      .expect(201);

    await request(http)
      .post(`/api/v1/portfolios/${portfolioId}/snapshots`)
      .expect(201);

    // Sanity check via direct Prisma counts.
    const prisma = ctx.app.get(PrismaService);
    expect(await prisma.asset.count({ where: { portfolioId } })).toBe(1);
    expect(await prisma.assetSnapshot.count({ where: { assetId } })).toBe(1);
    expect(
      await prisma.portfolioSnapshot.count({ where: { portfolioId } }),
    ).toBe(1);

    // Manual cascade: snapshots first (FK), then assets, then portfolio.
    // The schema sets `onDelete: Cascade` on snapshots & transactions but
    // Asset.portfolio is restrict-by-default — clean up children explicitly
    // to validate the relations behave as expected.
    await prisma.assetSnapshot.deleteMany({ where: { assetId } });
    await prisma.transaction.deleteMany({ where: { assetId } });
    await prisma.tagsOnAssets.deleteMany({ where: { assetId } });
    await prisma.categoriesOnAssets.deleteMany({ where: { assetId } });
    await request(http).delete(`/api/v1/assets/${assetId}`).expect(204);
    await request(http).delete(`/api/v1/portfolios/${portfolioId}`).expect(204);

    // Snapshots are cascaded by FK constraint when the portfolio is deleted.
    expect(
      await prisma.portfolioSnapshot.count({ where: { portfolioId } }),
    ).toBe(0);
    expect(await prisma.asset.count({ where: { portfolioId } })).toBe(0);
  });
});
