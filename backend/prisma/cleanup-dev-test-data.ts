import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./.data/strata-dev.db';
const lowerDatabaseUrl = databaseUrl.toLowerCase();

if (
  !lowerDatabaseUrl.includes('strata-dev.db') &&
  process.env.ALLOW_NON_DEV_CLEANUP !== '1'
) {
  console.error('❌ Refusing cleanup: DATABASE_URL is not strata-dev.db.');
  console.error(`   DATABASE_URL=${databaseUrl}`);
  console.error('   If this is intentional, rerun with ALLOW_NON_DEV_CLEANUP=1');
  process.exit(1);
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

function startsWithNameClauses(prefixes: string[]): { name: { startsWith: string } }[] {
  return prefixes.map((prefix) => ({ name: { startsWith: prefix } }));
}

async function collectCategoryIdsToDelete(): Promise<Set<string>> {
  const rootMatches = await prisma.category.findMany({
    where: {
      OR: startsWithNameClauses(['E2E Category ', 'Test Category ']),
    },
    select: { id: true },
  });

  const ids = new Set(rootMatches.map((category) => category.id));
  let frontier = rootMatches.map((category) => category.id);

  while (frontier.length > 0) {
    const children = await prisma.category.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });

    frontier = [];
    for (const child of children) {
      if (ids.has(child.id)) continue;
      ids.add(child.id);
      frontier.push(child.id);
    }
  }

  return ids;
}

async function deleteCategoriesLeafFirst(categoryIds: Set<string>): Promise<number> {
  if (categoryIds.size === 0) return 0;

  let remaining = await prisma.category.findMany({
    where: { id: { in: [...categoryIds] } },
    select: { id: true, parentId: true },
  });
  let deletedCount = 0;

  while (remaining.length > 0) {
    const parentIds = new Set(
      remaining
        .map((category) => category.parentId)
        .filter((id): id is string => Boolean(id)),
    );
    const leaves = remaining.filter((category) => !parentIds.has(category.id));

    if (leaves.length === 0) {
      throw new Error('Could not resolve category delete order.');
    }

    const leafIds = leaves.map((category) => category.id);
    const result = await prisma.category.deleteMany({
      where: { id: { in: leafIds } },
    });
    deletedCount += result.count;
    const deletedSet = new Set(leafIds);
    remaining = remaining.filter((category) => !deletedSet.has(category.id));
  }

  return deletedCount;
}

async function main(): Promise<void> {
  console.log(`🧹 Cleaning dev test data from ${databaseUrl}...`);

  const assetPatterns = ['Test Asset '];
  const tagPatterns = ['e2e-tag-', 'test-tag-'];

  const deletedAssets = await prisma.asset.deleteMany({
    where: {
      OR: startsWithNameClauses(assetPatterns),
    },
  });

  const deletedTags = await prisma.tag.deleteMany({
    where: {
      OR: startsWithNameClauses(tagPatterns),
    },
  });

  const categoryIds = await collectCategoryIdsToDelete();
  const deletedCategories = await deleteCategoriesLeafFirst(categoryIds);

  console.log(`  ✅ Assets removed: ${deletedAssets.count}`);
  console.log(`  ✅ Tags removed: ${deletedTags.count}`);
  console.log(`  ✅ Categories removed: ${deletedCategories}`);
  console.log('🧹 Cleanup complete.');
}

main()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
