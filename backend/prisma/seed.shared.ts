import { AssetTypeGroup, PrismaClient } from '@prisma/client';

export const ASSET_TYPES = [
  { code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
  { code: 'SAVINGS_ACCOUNT', label: 'Savings Account', group: 'SAVINGS' },
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
] as const;

export const BASE_CATEGORIES = [
  { name: 'Real Estate', children: ['Residential', 'Commercial', 'Land'] },
  { name: 'Financial', children: ['Banking', 'Investments', 'Retirement'] },
  { name: 'Personal', children: ['Vehicles', 'Electronics', 'Furniture'] },
  { name: 'Collections', children: ['Art', 'Wine', 'LEGO', 'Books'] },
  { name: 'Liabilities', children: ['Mortgages', 'Student Loans', 'Credit Cards'] },
] as const;

export async function seedAssetTypes(prisma: PrismaClient): Promise<void> {
  for (const at of ASSET_TYPES) {
    await prisma.assetType.upsert({
      where: { code: at.code },
      update: {
        label: at.label,
        group: at.group as AssetTypeGroup,
      },
      create: at as { code: string; label: string; group: AssetTypeGroup },
    });
  }
  console.log(`  ✅ ${ASSET_TYPES.length} asset types seeded`);
}

export async function seedBaseCategories(prisma: PrismaClient): Promise<void> {
  for (const cat of BASE_CATEGORIES) {
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
  console.log('  ✅ Base categories seeded');
}
