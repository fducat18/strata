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

const CATEGORIES = [
  { name: 'Real Estate', children: ['Residential', 'Commercial', 'Land'] },
  { name: 'Financial', children: ['Banking', 'Investments', 'Retirement'] },
  { name: 'Personal', children: ['Vehicles', 'Electronics', 'Furniture'] },
  { name: 'Collections', children: ['Art', 'Wine', 'LEGO', 'Books'] },
  { name: 'Liabilities', children: ['Mortgages', 'Student Loans', 'Credit Cards'] },
];

const TAGS = [
  'primary-residence', 'rental', 'paris', 'lyon', 'vintage',
  'high-value', 'income-generating', 'depreciating', 'appreciating',
  'insured', 'tax-deductible', 'liquid', 'illiquid',
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed asset types
  for (const at of ASSET_TYPES) {
    await prisma.assetType.upsert({
      where: { code: at.code },
      update: {},
      create: at,
    });
  }
  console.log(`  ✅ ${ASSET_TYPES.length} asset types seeded`);

  // Seed categories
  for (const cat of CATEGORIES) {
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
  console.log(`  ✅ Categories seeded`);

  // Seed tags
  for (const tagName of TAGS) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }
  console.log(`  ✅ ${TAGS.length} tags seeded`);

  // Seed demo portfolio
  const checkingType = await prisma.assetType.findUnique({ where: { code: 'CHECKING_ACCOUNT' } });
  if (checkingType) {
    const portfolio = await prisma.portfolio.upsert({
      where: { name: 'My Portfolio' },
      update: {},
      create: { name: 'My Portfolio', baseCurrency: 'EUR' },
    });
    console.log(`  ✅ Demo portfolio seeded: ${portfolio.name}`);
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
