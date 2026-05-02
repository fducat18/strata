import { AssetTypeGroup, PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

const ASSET_TYPES = [
  { code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
  { code: 'SAVINGS_ACCOUNT', label: 'Savings Account', group: 'FINANCIAL' },
  { code: 'CASH', label: 'Cash', group: 'FINANCIAL' },
  { code: 'REAL_ESTATE', label: 'Real Estate', group: 'REAL_ESTATE' },
  { code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
  { code: 'CRYPTO', label: 'Crypto', group: 'FINANCIAL' },
  { code: 'BONDS', label: 'Bonds', group: 'FINANCIAL' },
  { code: 'PERSONAL_PROPERTY', label: 'Personal Property', group: 'PERSONAL_PROPERTY' },
  { code: 'VEHICLE', label: 'Vehicle', group: 'PERSONAL_PROPERTY' },
  { code: 'LOAN', label: 'Loan', group: 'LIABILITIES' },
  { code: 'COLLECTIBLES', label: 'Collectibles', group: 'PHYSICAL_COLLECTIONS' },
  { code: 'BUSINESS', label: 'Business', group: 'OTHER' },
  { code: 'OTHER', label: 'Other', group: 'OTHER' },
];

const DEMO_CATEGORIES = [
  { name: 'Real Estate', children: ['Residential', 'Commercial', 'Land'] },
  { name: 'Financial', children: ['Banking', 'Investments', 'Retirement'] },
  { name: 'Personal', children: ['Vehicles', 'Electronics', 'Furniture'] },
  { name: 'Collections', children: ['Art', 'Wine', 'LEGO', 'Books'] },
  { name: 'Liabilities', children: ['Mortgages', 'Student Loans', 'Credit Cards'] },
];

const DEMO_TAGS = [
  'primary-residence', 'rental', 'paris', 'lyon', 'vintage',
  'high-value', 'income-generating', 'depreciating', 'appreciating',
  'insured', 'tax-deductible', 'liquid', 'illiquid',
];

async function seedAssetTypes(): Promise<void> {
  for (const at of ASSET_TYPES) {
    await prisma.assetType.upsert({
      where: { code: at.code },
      update: { group: at.group as AssetTypeGroup },
      create: at as { code: string; label: string; group: AssetTypeGroup },
    });
  }
  console.log(`  ✅ ${ASSET_TYPES.length} asset types seeded`);
}

async function seedDemoCategories(): Promise<void> {
  for (const cat of DEMO_CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
    for (const childName of cat.children) {
      await prisma.category.upsert({
        where: { name: childName },
        update: {},
        create: { name: childName, parentId: parent.id },
      });
    }
  }
  console.log(`  ✅ Demo categories seeded`);
}

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
    const existing = await prisma.asset.findFirst({
      where: { name: demo.name },
    });
    if (existing) {
      console.log(`  ⏭️  Asset "${demo.name}" already exists, skipping`);
      continue;
    }

    const asset = await prisma.asset.create({
      data: {
        name: demo.name,
        quantity: demo.quantity,
        assetTypeId: atByCode[demo.typeCode],
      },
    });

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

    await prisma.assetSnapshot.create({
      data: {
        assetId: asset.id,
        value: demo.snapshotValue ?? demo.unitPrice * demo.quantity,
        observedAt: new Date('2025-01-15'),
      },
    });

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

    console.log(`  ✅ Demo asset seeded: ${demo.name}`);
  }
}

// Historical portfolio snapshots (standalone — not linked to any portfolio table).
// Values: Jan=231000, Feb=234500, Mar=237200, Apr=239200 (matches asset sum)
const HISTORICAL_SNAPSHOTS = [
  { date: '2025-01-01', value: 231000.0 },
  { date: '2025-02-01', value: 234500.0 },
  { date: '2025-03-01', value: 237200.0 },
  { date: '2025-04-01', value: 239200.0 },
];

async function seedHistoricalSnapshots(): Promise<void> {
  for (const snap of HISTORICAL_SNAPSHOTS) {
    const observedAt = new Date(snap.date);
    const existing = await prisma.portfolioSnapshot.findFirst({
      where: { observedAt },
    });
    if (!existing) {
      await prisma.portfolioSnapshot.create({
        data: {
          value: snap.value,
          currency: 'EUR',
          notes: `Historical seed — ${snap.date}`,
          observedAt,
        },
      });
    }
  }
  console.log(`  ✅ Historical portfolio snapshots seeded (Jan–Apr 2025)`);
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');
  await seedAssetTypes();
  await seedDemoCategories();
  await seedDemoTags();
  await seedDemoAssets();
  await seedHistoricalSnapshots();
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
