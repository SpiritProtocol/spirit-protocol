import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

export const ADMIN_USERNAME = "test-admin";
export const ADMIN_PASSWORD = "test-admin-password";

/** Builds the full Fastify app (real Prisma, mock services) for `app.inject` requests. */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

/** Deletes all rows from every application table, keeping the migration history. */
export async function resetDatabase(app: FastifyInstance): Promise<void> {
  const tables = await app.prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await app.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

/** Builds Telegram `initData` accepted in dev auth mode (no HMAC check without a bot token). */
export function devInitData(user: { id: number; username?: string; first_name?: string }): string {
  return new URLSearchParams({
    user: JSON.stringify(user),
    auth_date: String(Math.floor(Date.now() / 1000)),
  }).toString();
}

export async function loginCollector(
  app: FastifyInstance,
  user: { id: number; username?: string; first_name?: string },
): Promise<{ token: string; userId: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/auth/telegram",
    payload: { initData: devInitData(user) },
  });
  if (res.statusCode !== 200) throw new Error(`Collector login failed: ${res.statusCode} ${res.body}`);
  const body = res.json() as { token: string; user: { id: string } };
  return { token: body.token, userId: body.user.id };
}

export async function createAdmin(app: FastifyInstance): Promise<void> {
  await app.prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      displayName: "Test Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 4),
    },
  });
}

export async function loginAdmin(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/auth/admin/login",
    payload: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  });
  if (res.statusCode !== 200) throw new Error(`Admin login failed: ${res.statusCode} ${res.body}`);
  return (res.json() as { token: string }).token;
}

export function bearer(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}
