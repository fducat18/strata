#!/bin/sh
# Startup script for the Strata backend Docker container.
# Seeds the database only on first run (fresh DB); subsequent starts run
# migrations only so user data and deliberate demo-asset deletions are preserved.
set -e

DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')

if [ ! -f "$DB_PATH" ]; then
  echo "Fresh database detected — running migrations and seed..."
  npx prisma migrate deploy
  npx prisma db seed
else
  echo "Existing database detected — running migrations only (seed skipped)."
  npx prisma migrate deploy
fi

exec node dist/main.js
