#!/usr/bin/env node
// scripts/check-ports.mjs
// Detects non-Docker processes occupying Docker-required ports (3000, 4321, 8001).
// Exits with code 1 and prints termination instructions if stale local servers are found.
// Called automatically by docker:dev and docker:reset.

import { execSync } from 'node:child_process';

const PORTS = [
  { port: 3000, service: 'NestJS API' },
  { port: 4321, service: 'Astro frontend' },
  { port: 8001, service: 'Docs (nginx)' },
];

let blocked = false;

for (const { port, service } of PORTS) {
  let pids = [];
  try {
    const out = execSync(`lsof -t -i :${port} -sTCP:LISTEN 2>/dev/null`, {
      encoding: 'utf8',
    }).trim();
    pids = out.split('\n').filter(Boolean);
  } catch {
    continue; // port is free
  }

  for (const pid of pids) {
    let cmd = '';
    try {
      cmd = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' }).trim();
    } catch {
      continue;
    }

    // Skip Docker's own port-forwarding processes on macOS
    if (
      cmd.includes('docker') ||
      cmd.includes('vpnkit') ||
      cmd.includes('com.docker')
    ) {
      continue;
    }

    blocked = true;
    console.error(`\n❌  Port ${port} (${service}) is held by a non-Docker process:`);
    try {
      const info = execSync(`ps -p ${pid} -o pid=,comm=,args=`, {
        encoding: 'utf8',
      }).trim();
      console.error(`   ${info}`);
    } catch {
      console.error(`   PID ${pid} (${cmd})`);
    }
    console.error(`   To free it, run: kill ${pid}`);
  }
}

if (blocked) {
  console.error(
    '\n⚠️  Stale local dev servers are blocking Docker ports.\n' +
      '   Run the kill commands above, then retry docker:dev or docker:reset.\n',
  );
  process.exit(1);
}

console.log('✅  Ports 3000, 4321, 8001 are clear for Docker.');
