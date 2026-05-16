# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS build
WORKDIR /app

# PUBLIC_API_URL is baked into the client bundle at build time.
# Override at build via: docker build --build-arg PUBLIC_API_URL=https://api.example.com .
# (Compose passes this through `services.front.build.args.PUBLIC_API_URL`.)
ARG PUBLIC_API_URL=http://localhost:3000/api/v1
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY package*.json ./
RUN npm ci --no-update-notifier --no-fund --loglevel=warn
COPY . .
# Write a fallback version.ts (the host-side `npm run docker:dev`
# regenerates the real one from `git describe` before the build context
# is sent). Skip the prebuild and call astro build directly.
RUN if [ ! -f src/lib/version.ts ]; then \
      printf '%s\n' \
        '// fallback — overwritten by host-side gen-version.mjs in real builds' \
        'export interface VersionInfo { version: string; env: "production"|"development"; gitSha: string; buildTime: string; }' \
        'export const VERSION: VersionInfo = { version: "0.0.0-docker", env: "production", gitSha: "docker", buildTime: new Date().toISOString() } as const;' \
        > src/lib/version.ts; \
    fi
RUN npx astro build

FROM node:24-alpine AS runtime
WORKDIR /app
RUN addgroup -S strata && adduser -S strata -G strata
COPY --from=build --chown=strata:strata /app/dist ./dist
COPY --from=build --chown=strata:strata /app/node_modules ./node_modules
COPY --from=build --chown=strata:strata /app/package.json ./
USER strata
ENV HOST=0.0.0.0
ENV PORT=6543
EXPOSE 6543
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:6543/ >/dev/null 2>&1 || exit 1
CMD ["node", "dist/server/entry.mjs"]
