import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
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
        'src/components/assets/AssetEditDialog.tsx',
        'src/components/portfolios/PortfolioDetailPage.tsx',
        'src/components/settings/BackupSection.tsx',
        'src/components/settings/useBackupExport.ts',
        'src/components/settings/useBackupImport.ts',
      ],
    },
  },
});
