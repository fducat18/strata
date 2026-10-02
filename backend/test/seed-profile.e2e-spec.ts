import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

async function seedWithProfile(profile: 'development' | 'production'): Promise<{
  assetTypes: number;
  categories: number;
  tags: number;
  assets: number;
  stockAssets: number;
  cryptoAssets: number;
  portfolioSnapshots: number;
}> {
  const tempDir = mkdtempSync(join(tmpdir(), 'strata-seed-profile-'));
  const dbPath = join(tempDir, 'seed-profile.db');
  const dbUrl = `file:${dbPath}`;
  const backendRoot = join(__dirname, '..');

  try {
    execSync('npx prisma migrate deploy', {
      cwd: backendRoot,
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
      stdio: 'pipe',
    });

    execSync('npx prisma db seed', {
      cwd: backendRoot,
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        STRATA_SEED_PROFILE: profile,
      },
      stdio: 'pipe',
    });

    const prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: dbUrl }),
    });
    await prisma.$connect();
    const [assetTypes, categories, tags, assets, stockAssets, cryptoAssets, portfolioSnapshots] = await Promise.all([
      prisma.assetType.count(),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.asset.count(),
      prisma.asset.count({ where: { assetType: { code: 'STOCKS' } } }),
      prisma.asset.count({ where: { assetType: { code: 'CRYPTO' } } }),
      prisma.portfolioSnapshot.count(),
    ]);
    await prisma.$disconnect();

    return { assetTypes, categories, tags, assets, stockAssets, cryptoAssets, portfolioSnapshots };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('Prisma seed profiles (e2e)', () => {
  it('production profile seeds only reference data', async () => {
    const counts = await seedWithProfile('production');

    expect(counts.assetTypes).toBeGreaterThan(0);
    expect(counts.categories).toBeGreaterThan(0);
    expect(counts.tags).toBe(0);
    expect(counts.assets).toBe(0);
    expect(counts.stockAssets).toBe(0);
    expect(counts.cryptoAssets).toBe(0);
    expect(counts.portfolioSnapshots).toBe(0);
  }, 60_000);

  it('development profile seeds demo data', async () => {
    const counts = await seedWithProfile('development');

    expect(counts.assetTypes).toBeGreaterThan(0);
    expect(counts.categories).toBeGreaterThan(0);
    expect(counts.tags).toBeGreaterThan(0);
    expect(counts.assets).toBeGreaterThan(0);
    expect(counts.stockAssets).toBeGreaterThan(0);
    expect(counts.cryptoAssets).toBeGreaterThan(0);
    expect(counts.portfolioSnapshots).toBeGreaterThan(0);
  }, 60_000);
});
