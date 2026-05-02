import request from 'supertest';
import { App } from 'supertest/types';
import { createIsolatedE2EApp, E2ETestContext } from './helpers/e2e-setup.js';

/**
 * Backup → wipe → restore round-trip.
 * Verifies BackupService preserves identifiers, decimal precision,
 * and join rows.
 */
describe('Admin backup/restore (e2e)', () => {
  let ctx: E2ETestContext;
  let assetTypeId: string;
  let assetId: string;
  let snapshotId: string;
  let tagId: string;

  beforeAll(async () => {
    ctx = await createIsolatedE2EApp({ seed: true });
    const http = ctx.app.getHttpServer() as unknown as App;

    // Create reproducible data.
    const types = await request(http).get('/api/v1/asset-types').expect(200);
    assetTypeId = types.body[0].id;

    const asset = await request(http)
      .post('/api/v1/assets')
      .send({
        name: 'Backup Asset',
        assetTypeId,
        quantity: '0.12345678',
      })
      .expect(201);
    assetId = asset.body.id;

    const snap = await request(http)
      .post(`/api/v1/assets/${assetId}/snapshots`)
      .send({ value: '1234.56', observedAt: '2025-01-01T00:00:00.000Z' })
      .expect(201);
    snapshotId = snap.body.id;

    const tag = await request(http)
      .post('/api/v1/tags')
      .send({ name: 'roundtrip-tag' })
      .expect(201);
    tagId = tag.body.id;

    await request(http)
      .post(`/api/v1/assets/${assetId}/tags/${tagId}`)
      .expect(201);
  }, 60_000);

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('exports → wipes → restores → counts and key fields match', async () => {
    const http = ctx.app.getHttpServer() as unknown as App;

    const exportRes = await request(http)
      .get('/api/v1/admin/backup')
      .expect(200);
    const payload = exportRes.body;
    expect(payload.schemaVersion).toBe('1');
    expect(payload.data.assets.length).toBeGreaterThanOrEqual(1);

    // Wipe by sending a replace-restore with empty data.
    await request(http)
      .post('/api/v1/admin/restore')
      .send({ schemaVersion: '1', data: {}, mode: 'replace' })
      .expect(201);

    // Confirm wipe — assets should be empty.
    const empty = await request(http).get('/api/v1/assets').expect(200);
    expect(empty.body).toEqual([]);

    // Restore from the captured payload.
    const restore = await request(http)
      .post('/api/v1/admin/restore')
      .send({
        schemaVersion: '1',
        data: payload.data,
        mode: 'replace',
      })
      .expect(201);
    expect(restore.body.counts.assets).toBeGreaterThanOrEqual(1);
    expect(restore.body.counts.tagsOnAssets).toBeGreaterThanOrEqual(1);

    // Re-fetch and verify identifiers + decimal precision survived.
    const asset = await request(http)
      .get(`/api/v1/assets/${assetId}`)
      .expect(200);
    expect(asset.body.quantity).toBe('0.12345678');
    expect(asset.body.tags.map((t: any) => t.id)).toContain(tagId);

    const snaps = await request(http)
      .get(`/api/v1/assets/${assetId}/snapshots`)
      .expect(200);
    expect(snaps.body.find((s: any) => s.id === snapshotId).value).toBe(
      '1234.56',
    );
  }, 30_000);

  it('rejects unsupported schemaVersion → 400', async () => {
    const http = ctx.app.getHttpServer() as unknown as App;
    await request(http)
      .post('/api/v1/admin/restore')
      .send({ schemaVersion: '99', data: {} })
      .expect(400);
  });

  describe('merge mode', () => {
    it('adds new records without wiping existing ones', async () => {
      const http = ctx.app.getHttpServer() as unknown as App;

      // Capture the current state as a baseline.
      const exportRes = await request(http)
        .get('/api/v1/admin/backup')
        .expect(200);
      const originalPayload = exportRes.body;
      const originalAssetCount: number = originalPayload.data.assets.length;
      expect(originalAssetCount).toBeGreaterThan(0);

      // Create a new asset that is NOT yet in the backup.
      const types = await request(http).get('/api/v1/asset-types').expect(200);
      const newAsset = await request(http)
        .post('/api/v1/assets')
        .send({ name: 'Merge-Only Asset', assetTypeId: types.body[0].id })
        .expect(201);
      const newAssetId: string = newAsset.body.id;

      // Restore the original backup in merge mode (should not wipe the new asset).
      const mergeRes = await request(http)
        .post('/api/v1/admin/restore')
        .send({
          schemaVersion: '1',
          data: originalPayload.data,
          mode: 'merge',
        })
        .expect(201);
      expect(mergeRes.body.mode).toBe('merge');

      // Both the original assets AND the new asset must still exist.
      const afterMerge = await request(http).get('/api/v1/assets').expect(200);
      const ids: string[] = afterMerge.body.map((a: any) => a.id);
      expect(ids).toContain(newAssetId);
      expect(afterMerge.body.length).toBeGreaterThanOrEqual(originalAssetCount + 1);
    }, 30_000);
  });
});
