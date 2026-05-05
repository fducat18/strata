➜  strata git:(main) ✗ npm run docker:reset

> strata@0.0.0 docker:reset
> node scripts/check-ports.mjs && docker-compose down && rm -f backend/.data/strata-dev.db && node scripts/gen-version.mjs all && docker-compose build --no-cache --parallel && docker-compose up

✅  Ports 3000, 4321, 8001 are clear for Docker.
[+] down 4/4
 ✔ Container strata-docs    Removed                                                                                                                                   0.1s
 ✔ Container strata-front   Removed                                                                                                                                   0.1s
 ✔ Container strata-backend Removed                                                                                                                                   0.1s
 ✔ Network strata_default   Removed                                                                                                                                   0.1s
[gen-version] wrote /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend/src/_generated/version.json → 0.0.0-dev+ff74903-dirty (development)
[gen-version] wrote /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front/src/lib/version.ts → 0.0.0-dev+ff74903-dirty (development)
[gen-version] wrote /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/docs/src/lib/version.ts → 0.0.0-dev+ff74903-dirty (development)
WARN[0000] Docker Compose requires buildx plugin to be installed
Sending build context to Docker daemon  146.5kB
Step 1/14 : FROM node:22-alpine AS build
Sending build context to Docker daemon  171.1kB
Step 1/32 : FROM node:22-alpine AS builder
22-alpine: Pulling from library/node
22-alpine: Pulling from library/node
Digest: sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f
Status: Downloaded newer image for node:22-alpine
Digest: sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f
Status: Downloaded newer image for node:22-alpine
 ---> 8ea2348b068a
Step 2/32 : WORKDIR /app
 ---> 8ea2348b068a
Step 2/14 : WORKDIR /site
 ---> Running in dada2903351d
 ---> Running in deaaecd48ac3
 ---> Removed intermediate container dada2903351d
 ---> 3f56080e9b4d
Step 3/32 : COPY certs/ /tmp/strata-certs/
 ---> Removed intermediate container deaaecd48ac3
 ---> 03b2c5eee3c4
Step 3/14 : COPY package.json package-lock.json*./
 ---> 1f0986335ca4
Step 4/32 : RUN apk add --no-cache ca-certificates python3 make g++     && find /tmp/strata-certs -name '*.crt' -exec cp {} /usr/local/share/ca-certificates/ \;     && update-ca-certificates     && rm -rf /tmp/strata-certs
 ---> Running in 265e04f31bb6
 ---> b96676d3e1ba
Step 4/14 : RUN --mount=type=cache,target=/root/.npm     npm ci --no-audit --no-fund --cache /root/.npm
[+] build 0/2
 ⠙ Image strata-docs    Building                                                                                                                                      4.7s
 ⠙ Image strata-backend Building                                                                                                                                      4.7s
the --mount option requires BuildKit. Refer to <https://docs.docker.com/go/buildkit/> to learn how to build images with BuildKit enabled
