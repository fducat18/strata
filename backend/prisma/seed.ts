import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ASSET_TYPES = [
  { code: 'CHECKING_ACCOUNT', label: 'Checking Account' },
  { code: 'SAVINGS_ACCOUNT', label: 'Savings Account' },
  { code: 'CASH', label: 'Cash' },
  { code: 'REAL_ESTATE', label: 'Real Estate' },
  { code: 'STOCKS', label: 'Stocks' },
  { code: 'CRYPTO', label: 'Crypto' },
  { code: 'BONDS', label: 'Bonds' },
  { code: 'PERSONAL_PROPERTY', label: 'Personal Property' },
  { code: 'VEHICLE', label: 'Vehicle' },
  { code: 'LOAN', label: 'Loan' },
  { code: 'COLLECTIBLES', label: 'Collectibles' },
  { code: 'BUSINESS', label: 'Business' },
  { code: 'OTHER', label: 'Other' },
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
      update: {},
      create: at,
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

async function seedDemoPortfolio(): Promise<void> {
  const portfolio = await prisma.portfolio.upsert({
    where: { name: 'My Portfolio' },
    update: {},
    create: { name: 'My Portfolio', baseCurrency: 'EUR' },
  });
  console.log(`  ✅ Demo portfolio seeded: ${portfolio.name}`);
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');
  await seedAssetTypes();

  if (process.env.SEED_DEMO_DATA === 'true') {
    console.log('🌱 SEED_DEMO_DATA=true — seeding demo data...');
    await seedDemoCategories();
    await seedDemoTags();
    await seedDemoPortfolio();
  } else {
    console.log('  ⏭️  Skipping demo data (set SEED_DEMO_DATA=true to enable).');
  }
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
