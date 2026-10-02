#!/bin/sh
# Startup script for the Strata backend Docker container.
# Seeds the database only on first run (fresh DB); subsequent starts run
# migrations only so user data and deliberate demo-asset deletions are preserved.
set -e

DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
SEED_PROFILE=${STRATA_SEED_PROFILE:-}

if [ -z "$SEED_PROFILE" ]; then
  if [ "${NODE_ENV:-development}" = "production" ]; then
    SEED_PROFILE="production"
  else
    SEED_PROFILE="development"
  fi
fi

if [ ! -f "$DB_PATH" ]; then
  echo "Fresh database detected — running migrations and seed ($SEED_PROFILE profile)..."
  npx prisma migrate deploy
  STRATA_SEED_PROFILE="$SEED_PROFILE" npx prisma db seed
else
  echo "Existing database detected — running migrations only (seed skipped)."
  npx prisma migrate deploy
fi

exec node dist/main.js
