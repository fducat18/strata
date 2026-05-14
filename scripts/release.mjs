#!/usr/bin/env node
// scripts/release.mjs — Tag a new Strata release.
//
// Usage:
//   npm run release -- X.Y.Z
//   npm run release -- X.Y.Z --dry-run        (prints steps, no git/gh commands executed)
//   npm run release -- X.Y.Z --no-push        (bumps, commits, tags — skips git push + gh release)
//   npm run release -- X.Y.Z --no-gh-release  (skip gh release create; tag only)
//   node scripts/release.mjs X.Y.Z
//
// What it does:
//   1. Validates the version is a valid semver (X.Y.Z)
//   2. Checks the git working tree is clean (no uncommitted changes)
//   3. Bumps version to X.Y.Z in all 6 version files:
//        package.json (root), backend/package.json, front/package.json,
//        docs/package.json, src-tauri/Cargo.toml, src-tauri/tauri.conf.json
//   4. git add those 6 files
//   5. git commit -m "chore: release vX.Y.Z"
//   6. git push origin HEAD  (skipped with --no-push)
//   7. git tag vX.Y.Z
//   8. git push origin vX.Y.Z  (skipped with --no-push)
//   9. gh release create vX.Y.Z --generate-notes --title "vX.Y.Z"
//        (skipped with --no-push or --no-gh-release; requires gh CLI authenticated)
//
// After this, `git describe` returns `X.Y.Z` (env: production) on a clean build.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const dryRun = flags.includes('--dry-run');
const noPush = flags.includes('--no-push');
const noGhRelease = flags.includes('--no-gh-release');
const version = args[0];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: npm run release -- X.Y.Z  (e.g. npm run release -- 1.2.3)');
  console.error('       Add --dry-run to preview without executing git commands.');
  process.exit(1);
}

const tag = `v${version}`;

function run(cmd, opts = {}) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { encoding: 'utf8', ...opts });
}

// Check working tree is clean (skip in dry-run — dry-run is for testing the logic)
if (!dryRun) {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
      console.error(`\n❌  Working tree is not clean. Commit or stash changes first.\n\n${status}\n`);
      process.exit(1);
    }
  } catch {
    console.error('❌  Failed to check git status.');
    process.exit(1);
  }
}

// Check tag does not already exist
if (!dryRun) {
  const existing = execSync(`git tag -l ${tag}`, { encoding: 'utf8' }).trim();
  if (existing) {
    console.error(`\n❌  Tag ${tag} already exists. Choose a different version.\n`);
    process.exit(1);
  }
}

// ── Bump version in all 6 files ──────────────────────────────────────────────

const packageJsonPaths = [
  resolve(repoRoot, 'package.json'),
  resolve(repoRoot, 'backend', 'package.json'),
  resolve(repoRoot, 'front', 'package.json'),
  resolve(repoRoot, 'docs', 'package.json'),
];

const cargoTomlPath = resolve(repoRoot, 'src-tauri', 'Cargo.toml');
const tauriConfPath = resolve(repoRoot, 'src-tauri', 'tauri.conf.json');

if (dryRun) {
  console.log(`\n[dry-run] Would bump version to ${version} in:`);
  for (const p of packageJsonPaths) console.log(`  - ${p.replace(repoRoot + '/', '')}`);
  console.log(`  - src-tauri/Cargo.toml`);
  console.log(`  - src-tauri/tauri.conf.json`);
} else {
  console.log(`\n▸ Bumping version to ${version} in all 6 files …`);

  for (const p of packageJsonPaths) {
    const pkg = JSON.parse(readFileSync(p, 'utf8'));
    pkg.version = version;
    writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✓ ${p.replace(repoRoot + '/', '')}`);
  }

  // Cargo.toml: replace `version = "X.Y.Z"` under [package] section
  let cargo = readFileSync(cargoTomlPath, 'utf8');
  cargo = cargo.replace(/^(version\s*=\s*)"[\d.]+"(\s*$)/m, `$1"${version}"$2`);
  writeFileSync(cargoTomlPath, cargo);
  console.log(`  ✓ src-tauri/Cargo.toml`);

  // tauri.conf.json
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = version;
  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
  console.log(`  ✓ src-tauri/tauri.conf.json`);
}

// ── Commit, push HEAD, tag, push tag ─────────────────────────────────────────

const filesToStage = [
  'package.json',
  'backend/package.json',
  'front/package.json',
  'docs/package.json',
  'src-tauri/Cargo.toml',
  'src-tauri/tauri.conf.json',
].join(' ');

console.log('');
run(`git add ${filesToStage}`, { stdio: 'inherit' });
run(`git commit -m "chore: release ${tag}"`, { stdio: 'inherit' });
if (!noPush) {
  run(`git push origin HEAD`, { stdio: 'inherit' });
}
run(`git tag ${tag}`, { stdio: 'inherit' });
if (!noPush) {
  run(`git push origin ${tag}`, { stdio: 'inherit' });
}
if (!noPush && !noGhRelease) {
  run(`gh release create ${tag} --generate-notes --title "${tag}"`, { stdio: 'inherit' });
}

if (dryRun) {
  console.log('\n✅  Dry run complete. Run without --dry-run to execute.\n');
} else if (noPush) {
  console.log(`\n✅  Tagged ${tag} locally (no push).`);
  console.log(`   All 6 version files updated to ${version}.`);
  console.log(`\n⚠️   --no-push mode: push manually when ready:`);
  console.log(`      git push origin HEAD`);
  console.log(`      git push origin ${tag}`);
  console.log(`      gh release create ${tag} --generate-notes --title "${tag}"\n`);
} else {
  console.log(`\n✅  Released ${tag}`);
  console.log(`   All 6 version files updated to ${version}.`);
  console.log(`   The app will report version ${version} (env: production) on a clean build.`);
  console.log(`   GitHub Release: https://github.com/fducat18/strata/releases/tag/${tag}`);
  console.log(`   Next: npm run docker:prod  OR  npm run tauri:prod\n`);
}
