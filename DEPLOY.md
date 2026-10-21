# Deploying Spirit Protocol to Railway

The app runs as **three services in one Railway project**:

| Service    | Source                    | Public URL                     |
|------------|---------------------------|--------------------------------|
| `Postgres` | Railway plugin            | internal only                  |
| `api`      | `apps/api/Dockerfile`     | `https://<api>.up.railway.app` |
| `web`      | `apps/web/Dockerfile`     | `https://<web>.up.railway.app` — this is the Telegram Mini App URL |

`web` is a static Vite bundle served by Caddy. `api` is the Fastify server; its
image runs `prisma migrate deploy` on start, then `node dist/server.js`. All
domain services (vault, payment, blockchain, hardware verification) run in
**mock** mode.

> **Note on config-as-code.** Railway deprecated `railway.json` / `railway.toml`
> for services created after mid-2025 — you can no longer attach a config file
> path in a new service's settings. So the build/deploy settings below are set
> **in the dashboard**. The Dockerfiles are the real contract; there is little to
> configure beyond pointing Railway at them.

---

## 0. Prerequisites

- A Railway account with access to the `SpiritProtocol/spirit-protocol` GitHub repo.
- The branch you want to deploy pushed to GitHub. For the first cut that is
  `feature/deploy-config`; point the services at it, then switch both to
  `master` after the PR merges (Service → Settings → Source → Branch).
- A JWT secret: `openssl rand -hex 32` (or `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`).

---

## 1. Create the project, database, and both services

Create everything first (even before the builds succeed) so that cross-service
variable references and generated domains exist when you fill in variables.

1. Railway → **New Project** → **Deploy from GitHub repo** → `SpiritProtocol/spirit-protocol`.
2. **New → Database → Add PostgreSQL**. Note its service name (usually
   `Postgres`).
3. You now have one repo service — rename it to **`api`** (Settings → rename).
4. **New → GitHub Repo →** same repo again → rename it to **`web`**.
5. For **both** `api` and `web`: Settings → Networking → **Generate Domain**.
   Write both URLs down.

---

## 2. Build & deploy settings (dashboard)

### `api` service — Settings

**Source**
- Branch: as per step 0.
- **Root Directory: leave empty.** The Dockerfile needs the repo root as its
  build context (it copies `pnpm-lock.yaml`, `packages/shared`, …).

**Build**
- Builder: **Dockerfile**
- Dockerfile Path: `apps/api/Dockerfile`

**Deploy**
- Healthcheck Path: `/health`
- Restart Policy: **On Failure**, max retries `10`
- Start Command: **leave empty.** The image already runs
  `pnpm exec prisma migrate deploy && node dist/server.js`.

### `web` service — Settings

**Source**
- Branch: same.
- **Root Directory: leave empty.**

**Build**
- Builder: **Dockerfile**
- Dockerfile Path: `apps/web/Dockerfile`

**Deploy**
- Healthcheck Path: `/`
- Restart Policy: **On Failure**, max retries `10`
- Start Command: leave empty (the Caddy image starts itself).

---

## 3. Variables

Set these under each service's **Variables** tab. For values shown as
`${{ … }}`, use the **"Add a Reference"** button and pick the service/variable
from the list rather than typing the token — that avoids the "invalid
reference" error you get when a name doesn't match or the target doesn't exist
yet. (All services and domains were created in step 1, so every reference
resolves.)

### `api`

| Key                          | Value                                                |
|------------------------------|------------------------------------------------------|
| `NODE_ENV`                   | `production`                                          |
| `DATABASE_URL`               | reference → `Postgres` → `DATABASE_URL`               |
| `JWT_SECRET`                 | *(your generated secret)*                             |
| `TELEGRAM_AUTH_MODE`         | `dev`                                                 |
| `CORS_ORIGIN`                | `https://` + `web`'s domain (see note below)          |
| `ADMIN_DEFAULT_USERNAME`     | `admin`                                               |
| `ADMIN_DEFAULT_PASSWORD`     | *(pick a real password)*                              |
| `HARDWARE_VERIFICATION_MODE` | `mock`                                                |
| `BLOCKCHAIN_MODE`            | `mock`                                                |
| `PAYMENT_MODE`               | `mock`                                                |
| `VAULT_MODE`                 | `mock`                                                |

- **`CORS_ORIGIN`**: the reference is `${{web.RAILWAY_PUBLIC_DOMAIN}}` but it has
  no scheme, so the full value is `https://${{web.RAILWAY_PUBLIC_DOMAIN}}`. If
  the reference editor rejects the concatenation, just paste the literal domain
  you wrote down: `https://spirit-web-xxxx.up.railway.app` (no trailing slash).
- Do **not** set `PORT` — Railway injects it and the server reads it.
- Do **not** set `TELEGRAM_BOT_TOKEN` yet: with a token present the API enforces
  Telegram HMAC even in `dev` mode, which breaks the plain-browser preview.

### `web`

| Key            | Value                                                |
|----------------|------------------------------------------------------|
| `VITE_API_URL` | `https://` + `api`'s domain (literal is fine here)   |

`VITE_API_URL` is read at **build time** — Railway passes service variables to
the Docker build as `ARG`s and the Dockerfile bakes it into the bundle. If you
change it later you must trigger a **redeploy** of `web`, not just a restart.

---

## 4. First deploy

1. Deploy **`api`** (Deployments → Deploy, or push a commit). Watch the logs:
   `prisma migrate deploy` applies `20260816161955_init`, then
   `Server listening`. Check `https://<api-domain>/health` → `{"status":"ok"}`.
2. **Load the investor demo data (one-off).**
   `api` → Settings → Deploy → **Start Command**, set temporarily to:
   ```
   sh -c "pnpm exec prisma migrate deploy && node dist/seed.js && node dist/server.js"
   ```
   Redeploy. Logs should print `Seeded investor demo dataset.` (the seed is
   idempotent — it skips if artworks already exist). Then **clear** the start
   command again (or leave it — it is safe to keep for a demo deployment).
3. Deploy **`web`**. Open `https://<web-domain>/` in a normal browser — in
   `dev` auth mode the app signs in with a synthetic user and the catalog shows
   the 5 seeded artworks. Admin panel: `https://<web-domain>/admin`
   (`admin` / your `ADMIN_DEFAULT_PASSWORD`).

---

## 5. Connect the Telegram bot

1. In [@BotFather](https://t.me/BotFather): `/newbot` (or reuse one).
2. `/newapp` (or **Bot Settings → Configure Mini App**) → set the Web App URL to
   `https://<web-domain>`. Optionally set the menu-button URL to the same.
3. Open the bot in Telegram, launch the Mini App — it now runs from Railway with
   no local process. At this point it is still using `dev` auth (no HMAC check).

### Switch to verified auth (recommended once the bot works)

On the `api` service:
- Add `TELEGRAM_BOT_TOKEN` = *(token from BotFather)*
- Set `TELEGRAM_AUTH_MODE` = `strict`

Redeploy `api`. The API now rejects any `initData` that fails Telegram's HMAC
check, so the app only works when opened inside Telegram (the plain-browser
preview stops working — expected).

---

## Redeploys & operations

- **Code changes**: push to the deployed branch → Railway auto-builds both
  services. Migrations run automatically on each `api` start.
- **New migration**: commit it under `apps/api/prisma/migrations/`; it is applied
  on the next `api` deploy.
- **Re-seed / reset demo data**: use the admin panel's Reset, or re-run the
  temporary start command from step 4.2.
- **Rotate `JWT_SECRET`**: changing it invalidates all issued tokens (users
  re-auth automatically on next load; admins must log in again).
- **After the PR merges**: switch both services' branch from
  `feature/deploy-config` to `master` (Settings → Source).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Can't select a "Config as Code" / railway.json path in settings | Expected — deprecated for new services. Use the dashboard Build/Deploy settings in §2. |
| "Invalid reference" when saving variables | The referenced service/variable name is wrong or didn't exist when you added it. Create all services first (step 1), then use the **Add a Reference** picker, or paste literal values. |
| `web` builds but the app calls `http://localhost:4000` | `VITE_API_URL` was missing/wrong at build time — set it and **redeploy** `web` (not restart) |
| API 401 on every request from the Mini App | `TELEGRAM_AUTH_MODE=strict` without a valid `TELEGRAM_BOT_TOKEN`, or the token doesn't match the bot serving the Mini App |
| Browser console CORS error | `CORS_ORIGIN` on `api` doesn't match the `web` domain (must include `https://`, no trailing slash) |
| Build can't find `packages/shared` or `pnpm-lock.yaml` | Service **Root Directory** is not empty — clear it |
| `api` crash-loops on boot | `DATABASE_URL` doesn't resolve — check the Postgres service name and that the reference points at its `DATABASE_URL` |
