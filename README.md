# Spirit Protocol

Investor-facing MVP of a **Telegram Mini App** for verification, provenance, ownership and
trading of physical artworks.

The MVP demonstrates the end-to-end concept:

> Physical Artwork → Spirit Identity → Verification → Digital Artwork Passport → Provenance
> → Ownership → Marketplace → Vault / Liquidity Protection → Purchase → New Ownership

Real blockchain, NFC hardware and financial infrastructure are **out of scope**. Everything
that would need them is implemented as a clean mock behind a service interface that a real
implementation can later replace without touching business logic.

---

## Tech stack

| Layer      | Choice |
|------------|--------|
| Monorepo   | pnpm workspaces (`apps/*`, `packages/*`), TypeScript project references |
| Backend    | Fastify 5, Prisma 6, PostgreSQL 16, `@fastify/jwt`, Zod |
| Frontend   | React 19, Vite, React Router 7, TanStack Query, Tailwind CSS 4, `lucide-react` |
| Shared     | `@spirit/shared` — Zod schemas, DTO types and enums used by both sides |
| Runtime    | Node >= 20 (developed on Node 24), pnpm 11 |

---

## Repository layout

```
apps/
  api/                    Fastify backend
    prisma/               schema, migrations, seed
    src/
      app.ts              app builder (plugins + route registration + error handler)
      env.ts              Zod-validated environment
      plugins/            prisma, auth (JWT), services (swappable), domain (business services)
      services/           swappable infrastructure — each has index.ts / types.ts / mock.ts
        blockchain/       mock ownership anchoring
        hardware-verification/  mock NFC / chip verification
        payment/          mock payment processing
        vault/            mock Vault lifecycle (future: TON smart contract)
      modules/            business logic, one folder per domain area
        auth/ artworks/ verifications/ provenance/ vault/
        listings/ purchases/ collection/ users/ demo/
      lib/vault-math.ts   liquidity-floor formula
  web/                    React Telegram Mini App
    src/
      routes/             collector screens + routes/admin/* panel
      components/          UI components (+ components/admin/*)
      context/            AuthContext, AdminAuthContext
      lib/                apiClient, telegram bridge, formatting
packages/
  shared/                 @spirit/shared — schemas, types, enums
docker-compose.yml        local PostgreSQL (port 5433)
```

---

## Architecture

Follows the principles in `CLAUDE.md`:

1. **Backend owns business logic.** The frontend is never trusted for status, ownership or
   money-moving operations.
2. **Status, verification status and ownership are separate concepts** — separate columns,
   separate state machines (`ArtworkStatus`, `VerificationStatus`, ownership via
   `currentOwnerId`).
3. **Provenance is an append-only event log** (`ProvenanceEvent`), written by services
   whenever something meaningful happens (created, verified, listed, sold, vault activated…).
4. **Infrastructure is isolated behind interfaces.** `services/*` each expose
   `create<Thing>Service()` returning an interface; only a `mock` implementation exists, and
   `*_MODE=real` throws `not implemented`. Swapping in a real service is a one-file change.
5. **Dependency wiring** happens in `plugins/domain.ts` (request-time services) and mirrored
   in `prisma/seed.ts` (seed-time). Business services receive their collaborators via the
   constructor.

### Request pipeline

```
Fastify
  → cors
  → prismaPlugin        (fastify.prisma)
  → authPlugin          (fastify.authenticate, fastify.requireRole)
  → servicesPlugin      (fastify.services — blockchain/hardware/payment/vault mocks)
  → domainPlugin        (fastify.domain — ArtworksService, VerificationsService, …)
  → module routes       (Zod-parse input → call domain service → return DTO)
  → setErrorHandler     (AppError → typed body, ZodError → 400 VALIDATION_ERROR)
```

### Vault (core product concept)

- Default coverage: **80%**.
- `liquidity_floor = artwork_value × coverage_percent` — see `lib/vault-math.ts`.
- The floor is **always derived, never persisted**, so it can't drift when value or coverage
  changes.
- `MockVaultService` persists only lifecycle state (`NOT_INITIALIZED` → `ACTIVE` → `LOCKED`)
  and coverage. No real collateral, buyback or TON transactions.

---

## Data model (Prisma)

`User`, `Artwork`, `ArtworkImage`, `VerificationRecord`, `ProvenanceEvent`, `Listing`,
`Transaction`, `Vault`, `VaultEvent`, `DemoOperationLog`.

Key enums: `UserRole`, `ArtworkStatus`, `VerificationStatus`, `ProvenanceEventType`,
`ListingStatus`, `TransactionStatus`, `VaultStatus`.

---

## API surface

All routes require a JWT (`Authorization: Bearer …`) unless noted. Admin routes additionally
require `role = ADMIN`.

| Method | Path | Notes |
|--------|------|-------|
| GET  | `/health` | public |
| POST | `/auth/telegram` | public — exchanges Telegram `initData` for a JWT |
| POST | `/auth/admin/login` | public — username / password |
| GET  | `/auth/me` | current user |
| GET  | `/artworks` · `/artworks/:id` | catalog + detail (filter by `status`, `ownerId`, `excludeOwnerId`) |
| POST/PATCH | `/artworks`, `/artworks/:id`, `/artworks/:id/status`, `/artworks/:id/owner` | admin |
| POST | `/verifications` | submit an artwork for verification |
| GET  | `/verifications/pending` | admin queue |
| GET  | `/verifications/artwork/:artworkId` | history |
| POST | `/verifications/:id/approve` · `/reject` | admin |
| GET  | `/provenance/:artworkId` | provenance timeline |
| GET  | `/vaults/:artworkId` | vault detail + derived floor |
| PATCH | `/admin/vaults/:artworkId/coverage` | admin — override coverage |
| GET/POST/PATCH | `/listings`, `/listings/:id` | marketplace listings |
| POST | `/purchases` · `/purchases/confirm` | mock purchase flow (initiate → confirm) |
| GET  | `/admin/transactions` | admin |
| GET  | `/collection` | caller's owned artworks + transactions |
| GET  | `/admin/users` | admin |
| POST | `/admin/demo/seed` · `/reset` · `/clear` · GET `/admin/demo/logs` | demo dataset control |

---

## Frontend

**Collector app** (`max-w-lg`, bottom nav):

| Route | Screen |
|-------|--------|
| `/` | Collection (owned artworks) |
| `/store` | Catalog / marketplace (owned artworks hidden) |
| `/artworks/:id` | Artwork detail — passport, provenance timeline, vault card, purchase panel |
| `/wallet` | Transactions |
| `/profile` | Profile |

**Admin panel** (`/admin/*`, separate `AdminAuthContext`): login, artworks + create form,
verification queue, transactions, demo data control.

Auth: on launch the app reads Telegram `initData` via `lib/telegram.ts`, posts it to
`/auth/telegram`, and stores the JWT. The UI is pinned to a **fixed light theme** (the
Telegram native header/background are forced white) so a client's dark theme doesn't bleed
into the Mini App chrome.

---

## Running locally

### 1. Prerequisites

- Node >= 20, pnpm 11
- Docker (for PostgreSQL) — or a local Postgres on `localhost:5433`

### 2. Install

```bash
pnpm install
```

### 3. Database

```bash
docker compose up -d          
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm --filter @spirit/api db:generate
pnpm --filter @spirit/api db:migrate:dev
pnpm db:seed                  
```

### 4. Run

```bash
pnpm dev:api
pnpm dev:web
```

## Scripts

Root (`package.json`):

| Script | Action |
|--------|--------|
| `pnpm dev:api` / `pnpm dev:web` | run one app in watch mode |
| `pnpm build` | `pnpm -r build` |
| `pnpm lint` | `pnpm -r lint` |
| `pnpm test` | `pnpm -r test` (Vitest) |
| `pnpm test:e2e` | web E2E |
| `pnpm db:migrate` / `pnpm db:seed` | Prisma migrate deploy / seed |
| `pnpm format` | Prettier |

