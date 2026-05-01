// Reads the build-time generated version metadata.
// Falls back to a safe default when the file isn't present yet
// (e.g. fresh clone, before `npm run prebuild`).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface VersionInfo {
  version: string;
  env: 'production' | 'development';
  gitSha: string;
  buildTime: string;
}

const FALLBACK: VersionInfo = {
  version: '0.0.0-dev',
  env: 'development',
  gitSha: 'unknown',
  buildTime: new Date().toISOString(),
};

let cached: VersionInfo | null = null;

export function getVersionInfo(): VersionInfo {
  if (cached) return cached;
  try {
    // __dirname works in CommonJS output (package.json has no "type": "module")
    const path = resolve(__dirname, '_generated', 'version.json');
    const raw = readFileSync(path, 'utf-8');
    cached = JSON.parse(raw) as VersionInfo;
  } catch {
    cached = FALLBACK;
  }
  return cached;
}
