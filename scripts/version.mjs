#!/usr/bin/env node
// scripts/version.mjs — single source of truth for the Strata version string.
//
// Resolves the current version via `git describe --tags --dirty --always`.
// Falls back to `0.0.0-dev+<sha>` if no tags exist yet (fresh clone, CI shallow,
// brand-new repo). Falls back further to `0.0.0-dev` if git itself is unavailable.
//
// Output rules (the entire string is what every surface displays):
//   - At a tagged commit, clean tree:   `1.2.3`
//   - N commits past tag <X.Y.Z>:       `1.2.3-4-gabc1234`
//   - Tree has uncommitted changes:     `1.2.3-4-gabc1234-dirty`
//   - No tags yet:                      `0.0.0-dev+abc1234`
//   - No git or shallow checkout:       `0.0.0-dev`
//
// Env classification (used by app code that imports versionInfo()):
//   - Clean tag, no `-dirty`, no `-g`:  env = 'production'
//   - Anything else:                    env = 'development'
//
// USAGE:
//   node scripts/version.mjs                 → prints version string
//   node scripts/version.mjs --json          → prints {version, env, gitSha, buildTime}
//   import { versionInfo } from '.../version.mjs'

import { execSync } from 'node:child_process';

function safeGit(args) {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

export function versionInfo() {
  const described = safeGit('describe --tags --dirty --always');
  const sha = safeGit('rev-parse --short HEAD') || 'unknown';
  const buildTime = new Date().toISOString();

  let version;
  if (!described) {
    version = '0.0.0-dev';
  } else if (/^v?\d+\.\d+\.\d+/.test(described)) {
    // strip leading "v"
    version = described.replace(/^v/, '');
  } else {
    // git describe with --always returns just a sha when no tag exists
    version = `0.0.0-dev+${described}`;
  }

  const isClean = /^\d+\.\d+\.\d+$/.test(version);
  const env = isClean ? 'production' : 'development';

  return { version, env, gitSha: sha, buildTime };
}

// CLI mode
if (import.meta.url === `file://${process.argv[1]}`) {
  const info = versionInfo();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log(info.version);
  }
}
