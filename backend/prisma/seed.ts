import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { seedAssetTypes, seedBaseCategories } from './seed.shared.js';
import { runProductionSeed } from './seed.prod.js';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

type SeedProfile = 'development' | 'production';

const PROFILE_ALIASES: Record<string, SeedProfile> = {
  dev: 'development',
  development: 'development',
  prod: 'production',
  production: 'production',
};

function resolveSeedProfile(): SeedProfile {
  const explicitRaw = process.env.STRATA_SEED_PROFILE?.trim().toLowerCase();
  if (explicitRaw) {
    const explicit = PROFILE_ALIASES[explicitRaw];
    if (explicit) {
      console.log(`🌱 Seed profile: ${explicit} (from STRATA_SEED_PROFILE=${explicitRaw})`);
      return explicit;
    }
    console.warn(
      `⚠️ Unknown STRATA_SEED_PROFILE="${explicitRaw}". Falling back to auto-detection.`,
    );
  }

  const databaseUrl = (process.env.DATABASE_URL ?? '').toLowerCase();
  if (/(^|[\\/])strata-dev\.db($|[?#])/u.test(databaseUrl)) {
    console.log('🌱 Seed profile: development (from DATABASE_URL=strata-dev.db)');
    return 'development';
  }
  if (/(^|[\\/])strata\.db($|[?#])/u.test(databaseUrl)) {
    console.log('🌱 Seed profile: production (from DATABASE_URL=strata.db)');
    return 'production';
  }
  if (/(^|[\\/])(test|dev)\.db($|[?#])/u.test(databaseUrl)) {
    console.log('🌱 Seed profile: development (from DATABASE_URL=test/dev db)');
    return 'development';
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('🌱 Seed profile: production (from NODE_ENV=production)');
    return 'production';
  }

  console.log('🌱 Seed profile: development (default fallback)');
  return 'development';
}

const DEMO_TAGS = [
  'primary-residence',
  'rental',
  'paris',
  'lyon',
  'vintage',
  'high-value',
  'income-generating',
  'depreciating',
  'appreciating',
  'insured',
  'tax-deductible',
  'liquid',
  'illiquid',
];

async function seedDemoTags(): Promise<void> {
  for (const tagName of DEMO_TAGS) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }
  console.log(`  ✅ ${DEMO_TAGS.length} demo tags seeded`);
}

// Seed values validated: 4250 + 22950 + 385000 - 180000 + 5000 + 2000 = 239200
// LIABILITIES (Home Loan) are stored as positive values; PortfolioSnapshotService subtracts them.
const DEMO_ASSETS: {
  name: string;
  typeCode: string;
  quantity: number;
  unitPrice: number;
  snapshotValue?: number;
  currency: string;
  tags: string[];
  categories: string[];
}[] = [
  {
    name: 'BNP Checking Account',
    typeCode: 'CHECKING_ACCOUNT',
    quantity: 1,
    unitPrice: 4250.0,
    currency: 'EUR',
    tags: ['liquid'],
    categories: ['Banking'],
  },
  {
    name: 'Livret A Savings',
    typeCode: 'SAVINGS_ACCOUNT',
    quantity: 1,
    unitPrice: 22950.0,
    currency: 'EUR',
    tags: ['liquid', 'tax-deductible'],
    categories: ['Banking'],
  },
  {
    name: 'Apartment Paris 11e',
    typeCode: 'REAL_ESTATE',
    quantity: 1,
    unitPrice: 385000.0,
    currency: 'EUR',
    tags: ['primary-residence', 'paris', 'high-value', 'insured'],
    categories: ['Residential'],
  },
  {
    name: 'Home Loan — BNP',
    typeCode: 'LOAN',
    quantity: 1,
    // unitPrice reflects outstanding loan balance; snapshotValue is positive
    // because the LIABILITIES group is subtracted from net worth in computation.
    unitPrice: 180000.0,
    snapshotValue: 180000.0,
    currency: 'EUR',
    tags: ['illiquid'],
    categories: ['Mortgages'],
  },
  {
    name: 'Toyota Yaris 2022',
    typeCode: 'VEHICLE',
    quantity: 1,
    unitPrice: 5000.0,
    currency: 'EUR',
    tags: ['depreciating', 'insured'],
    categories: ['Vehicles'],
  },
  {
    name: 'Renault Kangoo 2019',
    typeCode: 'VEHICLE',
    quantity: 1,
    unitPrice: 2000.0,
    currency: 'EUR',
    tags: ['depreciating'],
    categories: ['Vehicles'],
  },
];

async function seedDemoAssets(): Promise<void> {
  const assetTypes = await prisma.assetType.findMany();
  const atByCode = Object.fromEntries(assetTypes.map((at) => [at.code, at.id]));

  for (const demo of DEMO_ASSETS) {
    let asset = await prisma.asset.findFirst({
      where: { name: demo.name },
    });

    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          name: demo.name,
          quantity: demo.quantity,
          assetTypeId: atByCode[demo.typeCode],
        },
      });
    }

    const acquireTransaction = await prisma.transaction.findFirst({
      where: {
        assetId: asset.id,
        type: 'ACQUIRE',
      },
      select: { id: true },
    });
    if (!acquireTransaction) {
      await prisma.transaction.create({
        data: {
          assetId: asset.id,
          type: 'ACQUIRE',
          unitPrice: demo.unitPrice,
          quantity: demo.quantity,
          currency: demo.currency,
          occurredAt: new Date('2025-01-15'),
        },
      });
    }

    await ensureDemoAssetSnapshotHistory(
      asset.id,
      demo.name,
      demo.snapshotValue ?? demo.unitPrice * demo.quantity,
    );

    for (const tagName of demo.tags) {
      const tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (tag) {
        await prisma.tagsOnAssets.upsert({
          where: { assetId_tagId: { assetId: asset.id, tagId: tag.id } },
          update: {},
          create: { assetId: asset.id, tagId: tag.id },
        });
      }
    }

    for (const catName of demo.categories) {
      const cat = await prisma.category.findUnique({ where: { name: catName } });
      if (cat) {
        await prisma.categoriesOnAssets.upsert({
          where: { assetId_categoryId: { assetId: asset.id, categoryId: cat.id } },
          update: {},
          create: { assetId: asset.id, categoryId: cat.id },
        });
      }
    }

    console.log(`  ✅ Demo asset seeded/backfilled: ${demo.name}`);
  }
}

type DemoAssetHistoryMode = 'mixed' | 'declining';

type DemoAssetHistoryConfig = {
  mode: DemoAssetHistoryMode;
  oldestValue: number;
  stepDelta: number;
  variationPattern?: number[];
};

const HISTORY_YEARS = 10;
const HISTORY_POINTS_PER_YEAR = 3;
const HISTORY_STEP_MONTHS = 12 / HISTORY_POINTS_PER_YEAR;
const HISTORY_TOTAL_STEPS = HISTORY_YEARS * HISTORY_POINTS_PER_YEAR;

const MIXED_VARIATION_PATTERN = [-0.015, 0.025, -0.01, 0.03, -0.02, 0.015];

const DEMO_ASSET_HISTORY: Record<string, DemoAssetHistoryConfig> = {
  'BNP Checking Account': { mode: 'mixed', oldestValue: 3650, stepDelta: 22 },
  'Livret A Savings': { mode: 'mixed', oldestValue: 18000, stepDelta: 180 },
  'Apartment Paris 11e': { mode: 'mixed', oldestValue: 240000, stepDelta: 5000 },
  'Home Loan — BNP': { mode: 'declining', oldestValue: 250000, stepDelta: -2333.33 },
  'Toyota Yaris 2022': { mode: 'declining', oldestValue: 13000, stepDelta: -270 },
  'Renault Kangoo 2019': { mode: 'declining', oldestValue: 9000, stepDelta: -230 },
};

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toDateKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildSnapshotHistory(assetName: string): { observedAt: Date; value: number }[] {
  const hist = DEMO_ASSET_HISTORY[assetName];
  if (!hist) return [];

  const now = startOfDay(new Date());
  const pattern = hist.variationPattern ?? MIXED_VARIATION_PATTERN;
  const points: { observedAt: Date; value: number }[] = [];

  for (let i = HISTORY_TOTAL_STEPS; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i * HISTORY_STEP_MONTHS);
    const stepIndex = HISTORY_TOTAL_STEPS - i;
    const baseline = hist.oldestValue + stepIndex * hist.stepDelta;
    const value =
      hist.mode === 'declining'
        ? Math.max(0, baseline)
        : Math.max(0, baseline * (1 + pattern[stepIndex % pattern.length]));
    points.push({ observedAt: startOfDay(d), value: roundTo2(value) });
  }

  return points;
}

async function ensureDemoAssetSnapshotHistory(
  assetId: string,
  assetName: string,
  fallbackValue: number,
): Promise<void> {
  const generated = buildSnapshotHistory(assetName);
  if (generated.length === 0) {
    generated.push({
      observedAt: new Date('2025-01-15'),
      value: roundTo2(fallbackValue),
    });
  }

  const existingSnapshots = await prisma.assetSnapshot.findMany({
    where: { assetId },
    select: { id: true, observedAt: true },
  });
  const generatedDateKeys = new Set(generated.map((snapshot) => toDateKey(snapshot.observedAt)));

  const staleSnapshotIds = existingSnapshots
    .filter((snapshot) => !generatedDateKeys.has(toDateKey(snapshot.observedAt)))
    .map((snapshot) => snapshot.id);

  if (staleSnapshotIds.length > 0) {
    await prisma.assetSnapshot.deleteMany({
      where: { id: { in: staleSnapshotIds } },
    });
  }

  const existingByDate = new Map(
    existingSnapshots.map((snapshot) => [toDateKey(snapshot.observedAt), snapshot.id]),
  );

  for (const snapshot of generated) {
    const snapshotDateKey = toDateKey(snapshot.observedAt);
    const existingId = existingByDate.get(snapshotDateKey);
    if (existingId) {
      await prisma.assetSnapshot.update({
        where: { id: existingId },
        data: { observedAt: snapshot.observedAt, value: snapshot.value },
      });
      continue;
    }

    await prisma.assetSnapshot.create({
      data: { assetId, observedAt: snapshot.observedAt, value: snapshot.value },
    });
  }
}

async function seedPortfolioSnapshot(): Promise<void> {
  const existing = await prisma.portfolioSnapshot.findFirst({
    where: { notes: 'Historical seed — initial' },
  });
  if (!existing) {
    await prisma.portfolioSnapshot.create({
      data: {
        value: 239200.0,
        currency: 'EUR',
        notes: 'Historical seed — initial',
        observedAt: new Date('2025-04-01'),
      },
    });
  }
  console.log('  ✅ Portfolio snapshot seeded');
}

async function runDevelopmentSeed(): Promise<void> {
  console.log('🌱 Running development seed profile...');
  await seedAssetTypes(prisma);
  await seedBaseCategories(prisma);
  await seedDemoTags();
  await seedDemoAssets();
  await seedPortfolioSnapshot();
  console.log('🌱 Development seed complete!');
}

async function main(): Promise<void> {
  const profile = resolveSeedProfile();
  if (profile === 'production') {
    await runProductionSeed(prisma);
    return;
  }
  await runDevelopmentSeed();
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
