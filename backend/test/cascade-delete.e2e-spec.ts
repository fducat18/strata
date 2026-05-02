import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service.js';
import { createIsolatedE2EApp, E2ETestContext } from './helpers/e2e-setup.js';

describe('Cascade delete (e2e)', () => {
  let ctx: E2ETestContext;

  beforeAll(async () => {
    ctx = await createIsolatedE2EApp({ seed: true });
  }, 60_000);

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('deleting an asset cascades to its snapshots', async () => {
    const http = ctx.app.getHttpServer() as unknown as App;
    const types = await request(http).get('/api/v1/asset-types').expect(200);
    const assetTypeId = types.body[0].id;

    const a = await request(http)
      .post('/api/v1/assets')
      .send({ name: 'cascade-asset', assetTypeId, acquisitionDate: '2025-01-01', acquisitionPrice: '1000.00' })
      .expect(201);
    const assetId = a.body.id;

    await request(http)
      .post(`/api/v1/assets/${assetId}/snapshots`)
      .send({ value: '10.00', observedAt: '2025-06-01T00:00:00.000Z' })
      .expect(201);

    // Sanity check via direct Prisma counts.
    // Asset creation auto-creates 1 snapshot (C1 feature) + 1 manual = 2 total.
    const prisma = ctx.app.get(PrismaService);
    expect(await prisma.asset.count({ where: { id: assetId } })).toBe(1);
    expect(await prisma.assetSnapshot.count({ where: { assetId } })).toBe(2);

    // Delete asset — DB cascade should remove related records automatically.
    await request(http).delete(`/api/v1/assets/${assetId}`).expect(204);

    expect(await prisma.asset.count({ where: { id: assetId } })).toBe(0);
    expect(await prisma.assetSnapshot.count({ where: { assetId } })).toBe(0);
  });
});
