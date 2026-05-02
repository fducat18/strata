// backend/test/asset-snapshot-edit.e2e-spec.ts
//
// Regression tests for:
// - BUG-3: Duplicate snapshot on same day → 409
// - IMP-5: PUT /assets/:id/snapshots/:snapshotId → update snapshot
// - BUG-2: LIABILITIES assets reduce net worth (subtracted from total)
//
// Convention #5 (AGENTS.md): Bug-to-Test Rule

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIsolatedE2EApp } from './helpers/e2e-setup.js';

describe('Asset Snapshot Edit & Liability Net Worth (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await createIsolatedE2EApp({ seed: false });
    app = ctx.app as INestApplication<App>;
    cleanup = ctx.cleanup;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  });

  let assetTypeId: string;
  let liabilityTypeId: string;
  let assetId: string;
  let liabilityAssetId: string;
  let snapshotId: string;

  beforeAll(async () => {
    // Create a FINANCIAL asset type
    const atRes = await request(app.getHttpServer())
      .post('/api/v1/asset-types')
      .send({ code: 'SNAP_TEST_FIN', label: 'Snap Test Financial', group: 'FINANCIAL' })
      .expect(201);
    assetTypeId = atRes.body.id;

    // Create a LIABILITIES asset type
    const lRes = await request(app.getHttpServer())
      .post('/api/v1/asset-types')
      .send({ code: 'SNAP_TEST_LIA', label: 'Snap Test Liability', group: 'LIABILITIES' })
      .expect(201);
    liabilityTypeId = lRes.body.id;
  });

  describe('Snapshot creation and duplicate guard (BUG-3)', () => {
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .send({
          name: 'Snap E2E Asset',
          assetTypeId,
          acquisitionDate: '2024-01-01',
          acquisitionPrice: '10000.00',
        })
        .expect(201);
      assetId = res.body.id;
    });

    it('creates a snapshot successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/snapshots`)
        .send({ value: '12000.00', observedAt: '2024-06-01T00:00:00.000Z' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.value).toBe('12000');
      snapshotId = res.body.id;
    });

    it('returns 409 when creating a second snapshot on the same day', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/snapshots`)
        .send({ value: '13000.00', observedAt: '2024-06-01T12:00:00.000Z' })
        .expect(409);

      expect(res.body.message).toContain('snapshot already exists');
    });

    it('allows a snapshot on a different day', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/snapshots`)
        .send({ value: '14000.00', observedAt: '2024-06-02T00:00:00.000Z' })
        .expect(201);
    });
  });

  describe('Snapshot update (IMP-5)', () => {
    it('updates snapshot value via PUT', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/assets/${assetId}/snapshots/${snapshotId}`)
        .send({ value: '15000.00' })
        .expect(200);

      expect(res.body.id).toBe(snapshotId);
      expect(res.body.value).toBe('15000');
    });

    it('updates snapshot date via PUT', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/assets/${assetId}/snapshots/${snapshotId}`)
        .send({ observedAt: '2024-06-01T06:00:00.000Z' })
        .expect(200);

      expect(res.body.id).toBe(snapshotId);
      expect(res.body.observedAt).toContain('2024-06-01');
    });

    it('returns 404 for non-existent snapshot', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/assets/${assetId}/snapshots/nonexistent-id`)
        .send({ value: '999.00' })
        .expect(404);
    });

    it('returns 400 for invalid value', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/assets/${assetId}/snapshots/${snapshotId}`)
        .send({ value: 'not-a-number' })
        .expect(400);
    });
  });

  describe('Liability subtraction in net worth (BUG-2)', () => {
    it('subtracts LIABILITIES asset value from net worth', async () => {
      // Create a liability asset
      const lRes = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .send({
          name: 'Snap E2E Loan',
          assetTypeId: liabilityTypeId,
          acquisitionDate: '2024-01-01',
          acquisitionPrice: '50000.00',
        })
        .expect(201);
      liabilityAssetId = lRes.body.id;

      // Record a snapshot for the liability (positive value = loan balance)
      await request(app.getHttpServer())
        .post(`/api/v1/assets/${liabilityAssetId}/snapshots`)
        .send({ value: '50000.00', observedAt: '2024-07-01T00:00:00.000Z' })
        .expect(201);

      // Also record a snapshot for the financial asset
      await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/snapshots`)
        .send({ value: '100000.00', observedAt: '2024-07-01T00:00:00.000Z' })
        .expect(201);

      // Current value = 100000 (financial) - 50000 (liability) = 50000
      const valueRes = await request(app.getHttpServer())
        .get('/api/v1/portfolio-snapshots/current-value')
        .expect(200);

      const value = parseFloat(valueRes.body.value);
      // The net worth should be reduced by the liability
      expect(value).toBeLessThan(100000);
    });
  });
});
