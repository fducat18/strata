import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

const desktopStatic = process.env.STRATA_DESKTOP_STATIC === '1';

export default defineConfig({
  base: desktopStatic ? '/app/' : '/',
  output: desktopStatic ? 'static' : 'server',
  ...(desktopStatic ? {} : { adapter: node({ mode: 'standalone' }) }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 6543,
  },
});
