import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const releaseScript = fileURLToPath(new URL('./release.mjs', import.meta.url));

test('release keeps Cargo.lock package version in sync with Cargo.toml', () => {
  const repo = mkdtempSync(path.join(tmpdir(), 'strata-release-test-'));

  try {
    for (const directory of ['backend', 'docs', 'front', 'scripts', 'src-tauri']) {
      mkdirSync(path.join(repo, directory), { recursive: true });
    }

    copyFileSync(releaseScript, path.join(repo, 'scripts', 'release.mjs'));
    for (const directory of ['', 'backend', 'front', 'docs']) {
      writeFileSync(
        path.join(repo, directory, 'package.json'),
        JSON.stringify({ name: `strata-${directory || 'root'}`, version: '1.5.3' }, null, 2) + '\n',
      );
    }
    writeFileSync(
      path.join(repo, 'src-tauri', 'Cargo.toml'),
      '[package]\nname = "strata-desktop"\nversion = "1.5.3"\n',
    );
    writeFileSync(
      path.join(repo, 'src-tauri', 'Cargo.lock'),
      'version = 4\n\n[[package]]\nname = "strata-desktop"\nversion = "1.5.3"\n\n' +
        '[[package]]\nname = "serde"\nversion = "1.0.0"\n',
    );
    writeFileSync(
      path.join(repo, 'src-tauri', 'tauri.conf.json'),
      JSON.stringify({ version: '1.5.3' }, null, 2) + '\n',
    );

    execFileSync('git', ['init', '--quiet'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Release test'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'release-test@example.com'], { cwd: repo });
    execFileSync('git', ['add', '--all'], { cwd: repo });
    execFileSync('git', ['commit', '--quiet', '-m', 'initial'], { cwd: repo });

    execFileSync(process.execPath, [path.join(repo, 'scripts', 'release.mjs'), '1.6.0', '--no-push'], {
      cwd: repo,
      stdio: 'pipe',
    });

    const lockfile = readFileSync(path.join(repo, 'src-tauri', 'Cargo.lock'), 'utf8');
    assert.match(lockfile, /\[\[package\]\]\nname = "strata-desktop"\nversion = "1\.6\.0"/);
    assert.match(lockfile, /\[\[package\]\]\nname = "serde"\nversion = "1\.0\.0"/);
    assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' }), '');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
