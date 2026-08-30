# Deploying Spirit Protocol to Railway

The app runs as **three services in one Railway project**:

| Service    | Source                    | Public URL                     |
|------------|---------------------------|--------------------------------|
| `Postgres` | Railway plugin            | internal only                  |
| `api`      | `apps/api/Dockerfile`     | `https://<api>.up.railway.app` |
| `web`      | `apps/web/Dockerfile`     | `https://<web>.up.railway.app` — this is the Telegram Mini App URL |

`web` is a static Vite bundle served by Caddy. `api` is the Fastify server; it
applies Prisma migrations on start. All domain services (vault, payment,
blockchain, hardware verification) run in **mock** mode.

Config-as-code lives in `apps/api/railway.json` and `apps/web/railway.json`
(Dockerfile builder, healthcheck, restart policy). Everything else — variables,
domains, the Postgres plugin — is set once in the dashboard as described below.

---

## 0. Prerequisites

- A Railway account with access to the `SpiritProtocol/spirit-protocol` GitHub repo.
- The branch you want to deploy pushed to GitHub. For the first cut that is
  `feature/deploy-config`; point the services at it, then switch both to
  `master` after the PR merges (Service → Settings → Source → Branch).
- A JWT secret: `openssl rand -hex 32` (or `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`).

---

## 1. Create the project and database

1. Railway → **New Project** → **Deploy from GitHub repo** → `SpiritProtocol/spirit-protocol`.
   Railway will create one service from the repo — you can rename/reconfigure it
   as `api` in the next step, or delete it and add both services fresh.
2. In the project: **New → Database → Add PostgreSQL**. Leave its name as
   `Postgres` (the variable references below assume that name).

---

## 2. The `api` service

**Source**
- Repo: `SpiritProtocol/spirit-protocol`, branch as per step 0.
- **Root Directory: leave empty (`/`).** The Dockerfile expects the repo root as
  its build context.
- **Config-as-code path: `apps/api/railway.json`**
  (Settings → *Config-as-code* / *Railway Config File*).

**Variables** (Settings → Variables — use the *Reference* picker for `${{…}}` values):

| Key                          | Value                                    |
|------------------------------|------------------------------------------|
| `NODE_ENV`                   | `production`                             |
| `DATABASE_URL`               | `${{Postgres.DATABASE_URL}}`             |
| `JWT_SECRET`                 | *(your generated secret)*                |
| `TELEGRAM_AUTH_MODE`         | `dev`                                    |
| `CORS_ORIGIN`                | `https://${{web.RAILWAY_PUBLIC_DOMAIN}}` |
| `ADMIN_DEFAULT_USERNAME`     | `admin`                                  |
| `ADMIN_DEFAULT_PASSWORD`     | *(pick a real password)*                 |
| `HARDWARE_VERIFICATION_MODE` | `mock`                                   |
| `BLOCKCHAIN_MODE`            | `mock`                                   |
| `PAYMENT_MODE`               | `mock`                                   |
| `VAULT_MODE`                 | `mock`                                   |

Do **not** set `PORT` — Railway injects it and the server reads it.
Do **not** set `TELEGRAM_BOT_TOKEN` yet: with a token present the API enforces
Telegram HMAC even in `dev` mode, which breaks the plain-browser preview.

**Domain**: Settings → Networking → **Generate Domain** (needed now so the
`web` service can reference it).

---

## 3. The `web` service

- **New → GitHub Repo →** same repo / branch.
- **Root Directory: leave empty (`/`).**
- **Config-as-code path: `apps/web/railway.json`**

**Variables:**

| Key            | Value                                    |
|----------------|------------------------------------------|
| `VITE_API_URL` | `https://${{api.RAILWAY_PUBLIC_DOMAIN}}` |

`VITE_API_URL` is read at **build time** — Railway passes service variables to
the Docker build as `ARG`s, and the Dockerfile bakes it into the bundle. If you
change it later you must **redeploy** `web`, not just restart it.

**Domain**: Settings → Networking → **Generate Domain**. This URL is what goes
into BotFather.

---

## 4. First deploy

1. Deploy **`api`** first. Watch the logs — you should see
   `prisma migrate deploy` apply `20260816161955_init`, then
   `Server listening`. Check `https://<api-domain>/health` → `{"status":"ok"}`.
2. **Load the investor demo data (one-off).**
   api service → Settings → Deploy → **Custom Start Command**, set temporarily to:
   ```
   sh -c "pnpm exec prisma migrate deploy && node dist/seed.js && node dist/server.js"
   ```
   Redeploy. Logs should print `Seeded investor demo dataset.` (the seed is
   idempotent — it skips if artworks already exist). Then either clear the custom
   start command (falls back to `railway.json`) or leave it — it is safe to keep
   for a demo deployment.
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
  custom start command from step 4.2.
- **Rotate `JWT_SECRET`**: changing it invalidates all issued tokens (users
  re-auth automatically on next load; admins must log in again).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `web` builds but calls `http://localhost:4000` | `VITE_API_URL` missing/wrong at build time — set it and **redeploy** `web` |
| API 401 on every request from the Mini App | `TELEGRAM_AUTH_MODE=strict` without a valid `TELEGRAM_BOT_TOKEN`, or the token doesn't match the bot serving the Mini App |
| Browser console CORS error | `CORS_ORIGIN` on `api` doesn't match the `web` domain (must include scheme, no trailing slash) |
| Build can't find `packages/shared` or `pnpm-lock.yaml` | Service **Root Directory** is not empty — reset it to `/` |
| `api` crash-loops on boot | Check `DATABASE_URL` reference resolves (Postgres service named `Postgres`) and the DB is reachable |
