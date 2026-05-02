// backend/test/asset-type.e2e-spec.ts
//
// Regression test for: "Type 'string' is not assignable to type 'AssetTypeGroup'"
// in prisma-asset-type.repository.ts create() and update() — discovered via Docker
// build failure. Exercises the full NestJS stack + real Prisma + in-memory SQLite
// to catch any boundary type mismatch at integration time.
//
// Convention #5 (AGENTS.md): Bug-to-Test Rule

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIsolatedE2EApp } from './helpers/e2e-setup.js';

describe('AssetType CRUD with group enum (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    // No seed — this test manages its own data (Convention #6)
    const ctx = await createIsolatedE2EApp({ seed: false });
    app = ctx.app as INestApplication<App>;
    cleanup = ctx.cleanup;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  });

  let createdId: string;

  describe('POST /api/v1/asset-types', () => {
    it('creates an asset type with a valid group enum value (FINANCIAL)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-types')
        .send({ code: 'TEST_STOCKS', label: 'Test Stocks', group: 'FINANCIAL' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.code).toBe('TEST_STOCKS');
      expect(res.body.label).toBe('Test Stocks');
      expect(res.body.group).toBe('FINANCIAL');
      createdId = res.body.id;
    });

    it('creates an asset type with REAL_ESTATE group', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-types')
        .send({ code: 'TEST_REAL_ESTATE', label: 'Test Real Estate', group: 'REAL_ESTATE' })
        .expect(201);

      expect(res.body.group).toBe('REAL_ESTATE');

      // clean up this extra record
      await request(app.getHttpServer())
        .delete(`/api/v1/asset-types/${res.body.id}`)
        .expect(204);
    });

    it('rejects an invalid group value', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/asset-types')
        .send({ code: 'BAD', label: 'Bad', group: 'NOT_A_VALID_GROUP' })
        .expect(400);
    });
  });

  describe('PUT /api/v1/asset-types/:id', () => {
    it('updates the label and group of an existing asset type', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/asset-types/${createdId}`)
        .send({ label: 'Updated Label', group: 'OTHER' })
        .expect(200);

      expect(res.body.id).toBe(createdId);
      expect(res.body.label).toBe('Updated Label');
      expect(res.body.group).toBe('OTHER');
    });

    it('rejects an invalid group value on update', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/asset-types/${createdId}`)
        .send({ label: 'X', group: 'INVALID' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/asset-types/:id', () => {
    it('deletes the created asset type', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/asset-types/${createdId}`)
        .expect(204);
    });

    it('returns 404 for a deleted asset type', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/asset-types/${createdId}`)
        .expect(404);
    });
  });
});
