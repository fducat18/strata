import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Cap concurrent workers to prevent OOM on machines with limited RAM.
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 80,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/env.d.ts',
        '**/*.astro',
        '**/node_modules/**',
        'src/lib/version.ts',
        'src/test-setup.ts',
        'src/pages/**',
        'src/layouts/**',
        'src/**/index.ts',
        'src/**/index.tsx',
        'src/lib/types.ts',
        'src/components/assets/AssetDetailPage.tsx',
        'src/components/assets/AssetListPage.tsx',
        'src/components/assets/AssetSnapshotsList.tsx',
        'src/components/assets/AssetEditDialog.tsx',
        'src/components/assets/DisposeDialog.tsx',
        'src/components/asset-types/AssetTypesPage.tsx',
        'src/components/categories/CategoriesPage.tsx',
        'src/components/financing/FinancingScenariosPage.tsx',
        'src/components/financing/FinancingScenarioForm.tsx',
        'src/components/financing/FinancingComparison.tsx',
        'src/components/portfolios/PortfolioDetailPage.tsx',
        'src/components/portfolios/PortfolioListPage.tsx',
        'src/components/tags/TagsPage.tsx',
        'src/components/settings/BackupSection.tsx',
        'src/components/settings/useBackupExport.ts',
        'src/components/settings/useBackupImport.ts',
        'src/lib/appPath.ts',
      ],
    },
  },
});
