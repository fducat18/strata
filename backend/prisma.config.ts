import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Fallback keeps `prisma generate` working in CI/build environments where
    // DATABASE_URL is not set (runtime always provides the real value via env).
    url: process.env.DATABASE_URL ?? 'file:/tmp/build.db',
  },
});
