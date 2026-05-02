/**
 * Regression tests for:
 * - BUG-2: PUT /assets/:id must persist categoryIds, tagIds, and acquisitionDate
 * - BUG-3: GET /assets must return acquisitionDate in the response
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIsolatedE2EApp } from './helpers/e2e-setup.js';

describe('Asset CRUD fields (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: () => Promise<void>;

  // IDs created during tests
  let assetTypeId: string;
  let assetId: string;
  let categoryId: string;
  let tagId: string;

  beforeAll(async () => {
    const ctx = await createIsolatedE2EApp({ seed: false });
    app = ctx.app as INestApplication<App>;
    cleanup = ctx.cleanup;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  });

  // ─── Setup: create supporting entities ────────────────────────────────

  it('creates an asset type for tests', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/asset-types')
      .send({ code: 'TEST_CRUD', label: 'Test CRUD', group: 'FINANCIAL' })
      .expect(201);
    assetTypeId = res.body.id;
    expect(assetTypeId).toBeDefined();
  });

  it('creates a category for tests', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Test Category' })
      .expect(201);
    categoryId = res.body.id;
    expect(categoryId).toBeDefined();
  });

  it('creates a tag for tests', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tags')
      .send({ name: 'test-tag' })
      .expect(201);
    tagId = res.body.id;
    expect(tagId).toBeDefined();
  });

  // ─── BUG-3: acquisitionDate in GET /assets response ───────────────────

  it('POST /assets → creates asset; GET response includes acquisitionDate', async () => {
    const acquisitionDate = '2025-06-15';
    const res = await request(app.getHttpServer())
      .post('/api/v1/assets')
      .send({
        name: 'Test Asset CRUD',
        assetTypeId,
        acquisitionDate,
        acquisitionPrice: '50000.00',
      })
      .expect(201);

    assetId = res.body.id;
    expect(assetId).toBeDefined();

    // acquisitionDate should be present in the create response
    expect(res.body.acquisitionDate).toBeDefined();
    expect(res.body.acquisitionDate).toContain('2025-06-15');
  });

  it('GET /assets/:id → includes acquisitionDate', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}`)
      .expect(200);

    expect(res.body.acquisitionDate).toBeDefined();
    expect(res.body.acquisitionDate).toContain('2025-06-15');
  });

  it('GET /assets → list includes acquisitionDate on each asset', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/assets')
      .expect(200);

    const asset = res.body.find((a: { id: string }) => a.id === assetId);
    expect(asset).toBeDefined();
    expect(asset.acquisitionDate).toContain('2025-06-15');
  });

  // ─── BUG-2: PUT /assets/:id persists categoryIds and tagIds ───────────

  it('PUT /assets/:id with categoryIds → category persists on GET', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/assets/${assetId}`)
      .send({ categoryIds: [categoryId] })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}`)
      .expect(200);

    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].id).toBe(categoryId);
  });

  it('PUT /assets/:id with tagIds → tag persists on GET', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/assets/${assetId}`)
      .send({ tagIds: [tagId] })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}`)
      .expect(200);

    expect(res.body.tags).toHaveLength(1);
    expect(res.body.tags[0].id).toBe(tagId);
  });

  it('PUT /assets/:id with empty categoryIds → removes all categories', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/assets/${assetId}`)
      .send({ categoryIds: [] })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}`)
      .expect(200);

    expect(res.body.categories).toHaveLength(0);
  });

  it('PUT /assets/:id with acquisitionDate → updates ACQUIRE transaction date', async () => {
    const newDate = '2024-01-10';
    await request(app.getHttpServer())
      .put(`/api/v1/assets/${assetId}`)
      .send({ acquisitionDate: newDate })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}`)
      .expect(200);

    expect(res.body.acquisitionDate).toContain('2024-01-10');
  });
});
