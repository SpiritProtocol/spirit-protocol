# syntax=docker/dockerfile:1
#
# Web image: builds the Vite SPA and serves the static output with Caddy.
# Build context is the repo root.
#
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t spirit-web .
#
# VITE_API_URL is baked into the bundle at build time, so it must be set to the
# public API URL when building for a real environment.

FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# `@spirit/web...` = web plus its (workspace) dependencies, so @spirit/shared's
# own deps (zod) get installed too.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter "@spirit/web..."

COPY apps/web apps/web
COPY packages/shared packages/shared
RUN pnpm --filter @spirit/web build

# ---- runtime: Caddy serving the static build ----
FROM caddy:2-alpine AS runtime
COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
EXPOSE 8080
