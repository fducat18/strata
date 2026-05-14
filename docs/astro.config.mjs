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
      favicon: '/favicon-32x32.png',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/fducat18/strata' },
      ],
      head: [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs',
          },
        },
        {
          // Initialize Mermaid with a clean theme that works in both light and dark mode.
          tag: 'script',
          content: `
            window.addEventListener('DOMContentLoaded', () => {
              if (typeof mermaid !== 'undefined') {
                mermaid.initialize({
                  startOnLoad: true,
                  theme: 'base',
                  themeVariables: {
                    primaryColor: '#4f46e5',
                    primaryTextColor: '#1e1b4b',
                    primaryBorderColor: '#6366f1',
                    lineColor: '#6366f1',
                    secondaryColor: '#e0e7ff',
                    tertiaryColor: '#f5f3ff',
                    background: '#ffffff',
                    nodeBorder: '#6366f1',
                    clusterBkg: '#f0f4ff',
                    titleColor: '#4f46e5',
                    edgeLabelBackground: '#f0f4ff',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    fontSize: '14px',
                  },
                });
              }
            });
          `,
        },
      ],
      sidebar: [
        {
          label: 'Strata App',
          items: [
            { label: 'Overview', slug: 'strataapp' },
            { label: 'Features', slug: 'features' },
            { label: 'Use Cases', slug: 'usecases' },
            { label: 'Mental Model', slug: 'mentalmodel' },
          ],
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Quick Start', slug: 'quickstart' },
            { label: 'Development Setup', slug: 'dev-setup' },
            { label: 'Configuration', slug: 'configuration' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', slug: 'architecture' },
            { label: 'Backend', slug: 'backend' },
            { label: 'Frontend', slug: 'frontend' },
            { label: 'Docs Site', slug: 'docs-site' },
            { label: 'Desktop App', slug: 'desktopapp' },
            { label: 'Tech Stack', slug: 'techstack' },
            { label: 'Data Model', slug: 'datamodel' },
          ],
        },
        {
          label: 'API & Validation',
          items: [
            { label: 'API Reference', slug: 'api' },
            { label: 'Validation', slug: 'validation' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { label: 'Backup', slug: 'backup' },
            { label: 'Recovery', slug: 'recovery' },
            { label: 'Migrations', slug: 'migrations' },
            { label: 'Versioning', slug: 'versioning' },
            { label: 'Request Tracing', slug: 'request-tracing' },
          ],
        },
        {
          label: 'Releases',
          autogenerate: { directory: 'releases', reversed: true },
        },
        {
          label: 'Architecture Decisions',
          items: [
            { label: 'ADR-001: Tech Stack', slug: 'adr/adr-001-tech-stack' },
            { label: 'ADR-002: Portfolio Removal', slug: 'adr/adr-002-portfolio-removal' },
            { label: 'ADR-003: Database Strategy', slug: 'adr/adr-003-database-strategy' },
          ],
        },
        {
          label: 'Plans',
          autogenerate: { directory: 'plans', reversed: true },
        },

      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        SiteTitle: './src/components/DocsSiteTitle.astro',
      },
    }),
  ],
});
