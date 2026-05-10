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
// Overrides:
//   STRATA_ENV=development|production   Forces the env field (used by docker:reset/nuke to
//                                       ensure the docs image is always labelled DEV in local
//                                       dev stacks, even when building from a clean tag).
//
// Fallback — package.json version:
//   When git returns 0.0.0-dev (shallow clone, no tags — e.g. Cloudflare Pages), the version
//   is replaced by the value from the root package.json.  Since release.mjs always bumps
//   package.json in sync with the git tag, this produces a clean semver (e.g. "1.0.0") which
//   classifies as env=production automatically — no extra env var needed.
//
// USAGE:
//   node scripts/version.mjs                 → prints version string
//   node scripts/version.mjs --json          → prints {version, env, gitSha, buildTime}
//   import { versionInfo } from '.../version.mjs'

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function readPkgVersion() {
  try {
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

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
  const override = process.env.VERSION_OVERRIDE;
  const sha = safeGit('rev-parse --short HEAD') || 'unknown';
  const buildTime = new Date().toISOString();

  // Allow callers (e.g. docker:prod) to pin the version to the latest tag.
  if (override) {
    const version = override.replace(/^v/, '');
    const isClean = /^\d+\.\d+\.\d+$/.test(version);
    const env = isClean ? 'production' : 'development';
    return { version, env, gitSha: sha, buildTime };
  }

  const described = safeGit('describe --tags --dirty --always');

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

  // When git has no tag history (shallow clone, Cloudflare Pages, fresh repo),
  // use the root package.json version as fallback. release.mjs keeps it in sync
  // with git tags, so it always holds the correct release version.
  if (version.startsWith('0.0.0-dev')) {
    const pkgVersion = readPkgVersion();
    if (pkgVersion) version = pkgVersion;
  }

  const isClean = /^\d+\.\d+\.\d+$/.test(version);

  // STRATA_ENV lets callers (e.g. docker:reset/nuke) force the env label regardless
  // of what git describe says — needed to mark local dev Docker images as DEV even
  // when building from a clean release tag.
  const strataEnv = process.env.STRATA_ENV;
  const env = (strataEnv === 'development' || strataEnv === 'production')
    ? strataEnv
    : isClean ? 'production' : 'development';

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
