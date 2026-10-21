# syntax=docker/dockerfile:1
#
# API image. Build context is the repo root (needs the pnpm workspace files
# and packages/shared).
#
#   docker build -f apps/api/Dockerfile -t spirit-api .

FROM node:22-slim AS base
# openssl: required by the Prisma query engine at runtime and by `prisma generate`.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- build: full install, generate Prisma client, bundle with tsup ----
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
COPY packages/shared packages/shared
RUN pnpm --filter @spirit/api exec prisma generate \
  && pnpm --filter @spirit/api build

# ---- runtime: production deps + built artifacts only ----
FROM base AS runtime
ENV NODE_ENV=production
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod --filter "@spirit/api..."
COPY apps/api/prisma apps/api/prisma
RUN pnpm --filter @spirit/api exec prisma generate
COPY --from=build /app/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
# Railway/host injects PORT and the rest of the environment.
EXPOSE 4000
# Apply any pending migrations, then start. `prisma` is a runtime dependency
# so the CLI is available here.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
