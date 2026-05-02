#!/usr/bin/env node
// scripts/check-prereqs.mjs
// Run via: npm run setup  (from the repo root)
//
// Verifies all prerequisites before running Strata locally or with Docker.
// Prints a clear ✅/❌ checklist and exits 1 if any requirement is unmet.

import { execSync } from 'node:child_process';
import { createServer } from 'node:net';

const OK   = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';

let hasErrors = false;

function check(label, ok, fix) {
  console.log(`${ok ? OK : FAIL}  ${label}`);
  if (!ok) {
    if (fix) console.log(`      → ${fix}`);
    hasErrors = true;
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

console.log('\n🔍  Strata prerequisite check\n');

// ── Node.js version (required for local dev only; Docker always uses node:22-alpine) ──
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
check(
  `Node.js version: v${process.versions.node}${nodeVersion === 22 ? '  (required for local dev)' : ''}`,
  nodeVersion === 22,
  'Run: nvm install 22 && nvm use 22\n      Then: cd backend && npm install  (to rebuild native modules)',
);

// ── Docker ──────────────────────────────────────────────────────────────────────────
let dockerRunning = false;
try { execSync('docker info', { stdio: 'ignore' }); dockerRunning = true; } catch {}
check(
  'Docker is running',
  dockerRunning,
  'Start Docker Desktop (or your Docker daemon)',
);

// ── Ports ────────────────────────────────────────────────────────────────────────────
const ports = [
  { port: 3000, label: 'Backend API   port 3000' },
  { port: 4321, label: 'Frontend      port 4321' },
  { port: 8001, label: 'Docs site     port 8001' },
];

for (const { port, label } of ports) {
  const free = await isPortFree(port);
  check(
    `${label}  —  ${free ? 'port is free' : 'PORT IN USE ⚠️'}`,
    free,
    `lsof -i :${port}   then:  kill <PID shown in column 2>`,
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────────────
console.log('');
if (hasErrors) {
  console.log('\x1b[31mPlease fix the issues above before running Strata.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32mAll prerequisites met!\x1b[0m\n');
  console.log('  Docker (recommended):');
  console.log('    npm run docker:dev          ← dev mode, demo data');
  console.log('    npm run docker:prod         ← production mode, your real data');
  console.log('');
  console.log('  Local dev (without Docker):');
  console.log('    cd backend && npm run start:dev');
  console.log('    cd front   && npm run dev');
  console.log('');
}
