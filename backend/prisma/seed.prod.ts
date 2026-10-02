import { PrismaClient } from '@prisma/client';
import { seedAssetTypes, seedBaseCategories } from './seed.shared.js';

export async function runProductionSeed(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Running production seed profile...');
  await seedAssetTypes(prisma);
  await seedBaseCategories(prisma);
  console.log('🌱 Production seed complete!');
}
