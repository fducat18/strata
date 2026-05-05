# syntax=docker/dockerfile:1.7
# ---- Build stage: produce a static Astro Starlight site ----
FROM node:22-alpine AS build

WORKDIR /site

# Install deps with cache-friendly layer
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Build the docs site
COPY astro.config.mjs ./
COPY src ./src
COPY public ./public
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

# ---- Runtime stage: serve the built site with nginx ----
FROM nginx:alpine AS runtime

# Replace default nginx config with a clean one (listen 8001, serve /docs/).
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /site/dist /usr/share/nginx/html/docs

EXPOSE 8001
