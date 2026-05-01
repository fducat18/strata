// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://strata.ducatillon.net',
  base: '/docs',
  integrations: [
    starlight({
      title: 'Strata',
      description: 'Collect. Track. Grow. — Strata personal asset manager.',
      logo: { src: './src/assets/logo.avif', replacesTitle: false },
      social: {
        github: 'https://github.com/francoiducat/strata',
      },
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
            { label: 'Data Model', slug: 'datamodel' },
            { label: 'Frontend', slug: 'frontend' },
            { label: 'Migrations', slug: 'migrations' },
            { label: 'Backup', slug: 'backup' },
            { label: 'Desktop App', slug: 'desktopapp' },
            { label: 'Validation', slug: 'validation' },
            { label: 'Mental Model', slug: 'mentalmodel' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
