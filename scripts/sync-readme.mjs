#!/usr/bin/env node
// scripts/sync-readme.mjs — mirror docs index page to root README.md
//
// Replaces the previous Python script (assets/scripts/sync_readme.py).
// Source path is the new Astro Starlight docs root content file.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const candidates = [
  'docs/src/content/docs/index.md',
  'docs/src/content/docs/index.mdx',
  'docs/docs/index.md',
];

const source = candidates
  .map((p) => resolve(repoRoot, p))
  .find((p) => existsSync(p));

if (!source) {
  console.error(`error: no docs index found. Tried:\n  ${candidates.join('\n  ')}`);
  process.exit(1);
}

const target = resolve(repoRoot, 'README.md');
writeFileSync(target, readFileSync(source, 'utf8'), 'utf8');
console.log(`✓ synced ${source} → ${target}`);
