// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { remarkMermaid } from './src/plugins/remark-mermaid.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://strata.ducatillon.net',
  base: '/docs',
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
  integrations: [
    starlight({
      title: 'Strata',
      description: 'Collect. Track. Grow. — Strata personal asset manager.',
      logo: { src: './src/assets/logo.avif', replacesTitle: false },
      social: {
        github: 'https://github.com/francoiducat/strata',
      },
      head: [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs',
          },
        },
      ],
      sidebar: [
        {
          label: 'Strata App',
          items: [
            { label: 'Overview', slug: 'strataapp' },
            { label: 'Features', slug: 'features' },
            { label: 'Use Cases', slug: 'usecases' },
          ],
        },
        {
          label: 'Developer Docs',
          items: [
            { label: 'Quick Start', slug: 'quickstart' },
            { label: 'Recovery', slug: 'recovery' },
            { label: 'Versioning', slug: 'versioning' },
            { label: 'Tech Stack', slug: 'techstack' },
            { label: 'Architecture', slug: 'architecture' },
            { label: 'API Reference', slug: 'api' },
            { label: 'Data Model', slug: 'datamodel' },
            { label: 'Frontend', slug: 'frontend' },
            { label: 'Migrations', slug: 'migrations' },
            { label: 'Backup', slug: 'backup' },
            { label: 'Desktop App', slug: 'desktopapp' },
            { label: 'Validation', slug: 'validation' },
            { label: 'Mental Model', slug: 'mentalmodel' },
          ],
        },
        {
          label: 'Architecture Decisions',
          items: [
            { label: 'ADR-001: Tech Stack', slug: 'adr/adr-001-tech-stack' },
            { label: 'ADR-002: Portfolio Removal', slug: 'adr/adr-002-portfolio-removal' },
            { label: 'ADR-003: Database Strategy', slug: 'adr/adr-003-database-strategy' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
