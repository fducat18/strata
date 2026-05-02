# ----- builder -----
FROM node:22-alpine AS builder
WORKDIR /app
# Trust corporate TLS-intercept proxies (ZScaler, Netskope, …) if the
# developer dropped any PEM-encoded *.crt file in backend/certs/.
# Harmless no-op when the directory only contains the README.
COPY certs/ /tmp/strata-certs/
RUN apk add --no-cache ca-certificates \
    && find /tmp/strata-certs -name '*.crt' -exec cp {} /usr/local/share/ca-certificates/ \; \
    && update-ca-certificates \
    && rm -rf /tmp/strata-certs
COPY package*.json ./
RUN npm ci --no-update-notifier --no-fund --loglevel=warn
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
# Write a fallback version.json so the prebuild step can be skipped inside
# the image (the host-side `npm run docker:dev` regenerates the real one
# before the build context is sent if it's stale).
RUN mkdir -p src/_generated && \
    if [ ! -f src/_generated/version.json ]; then \
      echo "{\"version\":\"0.0.0-docker\",\"env\":\"production\",\"gitSha\":\"docker\",\"buildTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        > src/_generated/version.json; \
    fi
# Placeholder DATABASE_URL — Prisma 7's `prisma.config.ts` validates env at
# config load time, even for `prisma generate`. The real URL is injected by
# docker-compose / runtime; this value is never used outside the build.
ENV DATABASE_URL=file:/tmp/build.db
# Tell Node to trust the corporate CA bundle (above) when downloading
# Prisma engine binaries. Build-time only — the prod runtime image has
# its own pristine CA store.
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
# Last-resort escape hatch when running behind a TLS-intercept proxy that
# isn't trusted: skip TLS verification ONLY for the prisma binary download
# (Prisma still verifies SHA256 of the downloaded engine).
ARG INSECURE_BUILD_TLS=0
ENV NODE_TLS_REJECT_UNAUTHORIZED=$INSECURE_BUILD_TLS
RUN npx prisma generate
ENV NODE_TLS_REJECT_UNAUTHORIZED=1
# Skip the prebuild (gen-version.mjs needs the repo-root scripts/version.mjs
# which isn't in the build context). Use the fallback version.json above.
RUN npx nest build

# ----- runtime -----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Copy the full node_modules from builder (includes tsx needed for db seed).
# For a personal-use app, image size is not a concern.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package*.json ./
RUN mkdir -p .data && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health > /dev/null || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
