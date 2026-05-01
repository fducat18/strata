#!/usr/bin/env node
// backend/scripts/gen-version.mjs
// Writes src/_generated/version.json from the repo-wide version source of truth.
// Run automatically by `prebuild`, `prestart:dev`, `pretest`, `pretest:e2e`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionInfo } from '../../scripts/version.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'src', '_generated', 'version.json');

mkdirSync(dirname(out), { recursive: true });
const info = versionInfo();
writeFileSync(out, JSON.stringify(info, null, 2) + '\n');
console.log(`[gen-version] wrote ${out} → ${info.version} (${info.env})`);
