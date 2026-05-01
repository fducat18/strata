# ---- Build stage: produce a static Astro Starlight site ----
FROM node:22-alpine AS build

WORKDIR /site

# Install deps with cache-friendly layer
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund

# Build the docs site
COPY astro.config.mjs ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---- Runtime stage: serve the built site with nginx ----
FROM nginx:alpine AS runtime

# Replace default nginx config with a clean one (listen 8001, serve /docs/).
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /site/dist /usr/share/nginx/html/docs

EXPOSE 8001
