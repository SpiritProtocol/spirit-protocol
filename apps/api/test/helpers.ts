import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach } from "vitest";
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

type Json = Record<string, unknown>;

/** `app.inject` shortcut: sends JSON with an optional bearer token and returns status + parsed body. */
export async function api(
  app: FastifyInstance,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  token?: string,
  payload?: Json,
): Promise<{ status: number; body: any }> {
  const res = await app.inject({ method, url, payload, headers: token ? bearer(token) : undefined });
  return { status: res.statusCode, body: res.body ? res.json() : undefined };
}

/** Logs in a collector and returns the id of one of their (verified) starter artworks. Requires an admin to exist. */
export async function collectorWithArtwork(
  app: FastifyInstance,
  telegramId: number,
): Promise<{ token: string; userId: string; artworkId: string }> {
  const { token, userId } = await loginCollector(app, { id: telegramId, username: `user${telegramId}` });
  const collection = await api(app, "GET", "/collection", token);
  const artwork = collection.body.artworks[0];
  if (!artwork) throw new Error("Collector has no starter artworks; did the test create an admin?");
  return { token, userId, artworkId: artwork.id };
}

/** Creates a DRAFT artwork owned by `ownerId` through the admin API. */
export async function createDraftArtwork(app: FastifyInstance, adminToken: string, ownerId: string): Promise<string> {
  const res = await api(app, "POST", "/artworks", adminToken, {
    title: "Test Artwork",
    artist: "Test Artist",
    year: 2024,
    medium: "Oil on canvas",
    description: "Created by a test",
    value: 1000,
    images: ["https://example.com/a.jpg"],
    ownerId,
  });
  if (res.status !== 201) throw new Error(`Artwork create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

/**
 * Registers the usual hooks for a test file: one app per file, an empty database and a fresh
 * admin before each test. Read `ctx.app` / `ctx.adminToken` inside tests, not at describe time.
 */
export function useTestApp(): { app: FastifyInstance; adminToken: string } {
  const ctx = {} as { app: FastifyInstance; adminToken: string };
  beforeAll(async () => {
    ctx.app = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.app);
    await createAdmin(ctx.app);
    ctx.adminToken = await loginAdmin(ctx.app);
  });
  return ctx;
}
