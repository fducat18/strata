import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIsolatedE2EApp } from './helpers/e2e-setup.js';

describe('Strata API (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await createIsolatedE2EApp({ seed: true });
    app = ctx.app as INestApplication<App>;
    cleanup = ctx.cleanup;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  });

  // ─── Portfolio Snapshots lifecycle ────────────────────────────────────

  let createdSnapshotId: string;

  describe('Portfolio Snapshots', () => {
    it('GET /api/v1/portfolio-snapshots → returns seeded snapshots', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/portfolio-snapshots')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/portfolio-snapshots/current-value → returns computed net worth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/portfolio-snapshots/current-value')
        .expect(200);
      expect(res.body).toHaveProperty('value');
      expect(res.body).toHaveProperty('currency');
    });

    it('POST /api/v1/portfolio-snapshots → creates a snapshot (auto-compute)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/portfolio-snapshots')
        .send({})
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('value');
      expect(res.body).toHaveProperty('currency');
      expect(parseFloat(res.body.value)).toBeCloseTo(239200, 0);
      createdSnapshotId = res.body.id;
    });

    it('POST /api/v1/portfolio-snapshots → creates a snapshot with explicit value', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/portfolio-snapshots')
        .send({ value: '100000.00', currency: 'EUR', notes: 'Manual snapshot' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(parseFloat(res.body.value)).toBeCloseTo(100000.0);
      expect(res.body.notes).toBe('Manual snapshot');
      // clean up
      await request(app.getHttpServer())
        .delete(`/api/v1/portfolio-snapshots/${res.body.id}`)
        .expect(204);
    });

    it('DELETE /api/v1/portfolio-snapshots/:id → deletes snapshot', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/portfolio-snapshots/${createdSnapshotId}`)
        .expect(204);
    });

    it('DELETE /api/v1/portfolio-snapshots/nonexistent → 404', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/portfolio-snapshots/00000000-0000-0000-0000-000000000000')
        .expect(404);
      expect(res.body.code).toBe('PORTFOLIO_SNAPSHOT_NOT_FOUND');
    });
  });

  // ─── Asset lifecycle ───────────────────────────────────────────────

  let assetTypeId: string;
  let createdAssetId: string;

  describe('Assets', () => {
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/asset-types')
        .expect(200);
      assetTypeId = res.body[0].id;
    });

    it('POST /api/v1/assets → creates an asset', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .send({
          name: 'E2E Asset',
          assetTypeId,
          quantity: '100',
          acquisitionDate: '2025-01-01',
          acquisitionPrice: '1000.00',
        })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Asset');
      createdAssetId = res.body.id;
    });

    it('GET /api/v1/assets → returns assets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/assets')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/assets/:id → returns the asset', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/${createdAssetId}`)
        .expect(200);
      expect(res.body.id).toBe(createdAssetId);
    });

    it('PUT /api/v1/assets/:id → updates the asset', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/assets/${createdAssetId}`)
        .send({ name: 'E2E Updated Asset' })
        .expect(200);
      expect(res.body.name).toBe('E2E Updated Asset');
    });

    it('POST /api/v1/assets/:id/snapshots → creates a snapshot', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${createdAssetId}/snapshots`)
        .send({ value: '5000.50', observedAt: '2024-06-01T00:00:00.000Z' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.assetId).toBe(createdAssetId);
      expect(parseFloat(res.body.value)).toBeCloseTo(5000.5);
    });

    it('GET /api/v1/assets/:id/snapshots → returns snapshots', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/${createdAssetId}/snapshots`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/v1/assets/:id/dispose → disposes the asset', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/assets/${createdAssetId}/dispose`)
        .send({ disposalDate: '2025-06-01', disposalPrice: '500.00' })
        .expect(200);
      expect(res.body.disposed).toBe(true);
    });
  });

  // ─── Tag lifecycle & asset-tag association ─────────────────────────

  let createdTagId: string;

  describe('Tags', () => {
    it('POST /api/v1/tags → creates a tag', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tags')
        .send({ name: 'e2e-tag' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('e2e-tag');
      createdTagId = res.body.id;
    });

    it('GET /api/v1/tags → lists tags', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tags')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/tags/:id → gets a tag', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tags/${createdTagId}`)
        .expect(200);
      expect(res.body.id).toBe(createdTagId);
    });

    it('POST /api/v1/assets/:id/tags/:tagId → adds tag to asset', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${createdAssetId}/tags/${createdTagId}`)
        .expect(201);
      expect(res.body.tags).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: createdTagId })]),
      );
    });

    it('DELETE /api/v1/assets/:id/tags/:tagId → removes tag from asset', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/assets/${createdAssetId}/tags/${createdTagId}`)
        .expect(204);
    });

    it('DELETE /api/v1/tags/:id → deletes the tag', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/tags/${createdTagId}`)
        .expect(204);
    });
  });

  // ─── Category lifecycle & asset-category association ───────────────

  let createdCategoryId: string;
  let childCategoryId: string;

  describe('Categories', () => {
    it('POST /api/v1/categories → creates a root category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'E2E Category' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Category');
      expect(res.body.parentId).toBeNull();
      createdCategoryId = res.body.id;
    });

    it('POST /api/v1/categories → creates a child category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'E2E Child', parentId: createdCategoryId })
        .expect(201);
      expect(res.body.parentId).toBe(createdCategoryId);
      childCategoryId = res.body.id;
    });

    it('GET /api/v1/categories → lists categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/v1/categories/:id → gets a category', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${createdCategoryId}`)
        .expect(200);
      expect(res.body.id).toBe(createdCategoryId);
    });

    it('GET /api/v1/categories/:id/children → gets children', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${createdCategoryId}/children`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: childCategoryId }),
        ]),
      );
    });

    it('DELETE /api/v1/categories/:id → fails when category has children', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${createdCategoryId}`)
        .expect(409);
      expect(res.body.code).toBe('CATEGORY_HAS_CHILDREN');
    });

    it('POST /api/v1/assets/:id/categories/:categoryId → adds category to asset', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${createdAssetId}/categories/${childCategoryId}`)
        .expect(201);
      expect(res.body.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: childCategoryId }),
        ]),
      );
    });

    it('DELETE /api/v1/assets/:id/categories/:categoryId → removes category from asset', async () => {
      await request(app.getHttpServer())
        .delete(
          `/api/v1/assets/${createdAssetId}/categories/${childCategoryId}`,
        )
        .expect(204);
    });

    it('DELETE child, then parent category', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${childCategoryId}`)
        .expect(204);
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${createdCategoryId}`)
        .expect(204);
    });
  });

  // ─── Asset Types (read-only) ───────────────────────────────────────

  describe('Asset Types', () => {
    it('GET /api/v1/asset-types → lists all asset types', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/asset-types')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(13);
    });

    it('GET /api/v1/asset-types/:id → gets one asset type', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/asset-types')
        .expect(200);
      const id = list.body[0].id;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/asset-types/${id}`)
        .expect(200);
      expect(res.body.id).toBe(id);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('label');
    });
  });

  // ─── Error handling ────────────────────────────────────────────────

  describe('Error handling', () => {
    it('GET /api/v1/assets/nonexistent → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/assets/00000000-0000-0000-0000-000000000000')
        .expect(404);
      expect(res.body.code).toBe('ASSET_NOT_FOUND');
    });

    it('POST /api/v1/assets with invalid data → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/assets')
        .send({})
        .expect(400);
    });

    it('GET /api/v1/tags/nonexistent → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tags/00000000-0000-0000-0000-000000000000')
        .expect(404);
      expect(res.body.code).toBe('TAG_NOT_FOUND');
    });

    it('GET /api/v1/asset-types/nonexistent → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/asset-types/00000000-0000-0000-0000-000000000000')
        .expect(404);
      expect(res.body.code).toBe('ASSET_TYPE_NOT_FOUND');
    });
  });

  // ─── Cleanup: delete the test asset ───────────────────────────────

  describe('Cleanup', () => {
    it('DELETE /api/v1/assets/:id → deletes the test asset', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/assets/${createdAssetId}`)
        .expect(204);
    });
  });
});

