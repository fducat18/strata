# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build
WORKDIR /app

# PUBLIC_API_URL is baked into the client bundle at build time.
# Override at build via: docker build --build-arg PUBLIC_API_URL=https://api.example.com .
# (Compose passes this through `services.front.build.args.PUBLIC_API_URL`.)
ARG PUBLIC_API_URL=http://localhost:3000/api/v1
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S strata && adduser -S strata -G strata
COPY --from=build --chown=strata:strata /app/dist ./dist
COPY --from=build --chown=strata:strata /app/node_modules ./node_modules
COPY --from=build --chown=strata:strata /app/package.json ./
USER strata
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/ >/dev/null 2>&1 || exit 1
CMD ["node", "dist/server/entry.mjs"]
