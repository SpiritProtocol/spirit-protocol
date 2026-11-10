import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_USERNAME,
  bearer,
  createAdmin,
  createTestApp,
  loginAdmin,
  loginCollector,
  resetDatabase,
} from "./helpers.js";

// Checks that the test harness works end to end: app boot, database reset, both login flows.
describe("test harness smoke", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  it("serves /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("starts every test with an empty database", async () => {
    expect(await app.prisma.user.count()).toBe(0);
    expect(await app.prisma.artwork.count()).toBe(0);
  });

  it("logs a new collector in through Telegram and returns their profile", async () => {
    const { token, userId } = await loginCollector(app, { id: 1001, username: "alice", first_name: "Alice" });

    const me = await app.inject({ method: "GET", url: "/auth/me", headers: bearer(token) });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ id: userId, role: "COLLECTOR" });
  });

  it("rejects requests without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("logs the admin in with the right password only", async () => {
    await createAdmin(app);
    await expect(loginAdmin(app)).resolves.toEqual(expect.any(String));

    const wrong = await app.inject({
      method: "POST",
      url: "/auth/admin/login",
      payload: { username: ADMIN_USERNAME, password: "wrong-password" },
    });
    expect(wrong.statusCode).toBe(401);
  });
});
