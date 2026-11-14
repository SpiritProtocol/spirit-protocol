import { describe, expect, it } from "vitest";
import { api, loginCollector, useTestApp } from "./helpers.js";

describe("starter collection", () => {
  const ctx = useTestApp();

  it("gives a new collector 3 verified artworks they own", async () => {
    const { token, userId } = await loginCollector(ctx.app, { id: 2001 });
    const collection = await api(ctx.app, "GET", "/collection", token);

    expect(collection.body.artworks).toHaveLength(3);
    for (const artwork of collection.body.artworks) {
      expect(artwork.status).toBe("VERIFIED");
    }
    expect(await ctx.app.prisma.artwork.count({ where: { currentOwnerId: userId } })).toBe(3);
  });

  it("is not granted again on later logins", async () => {
    const { userId } = await loginCollector(ctx.app, { id: 2002 });
    await loginCollector(ctx.app, { id: 2002 });
    await loginCollector(ctx.app, { id: 2002 });

    expect(await ctx.app.prisma.artwork.count({ where: { currentOwnerId: userId } })).toBe(3);
  });

  it("is granted exactly once when several logins arrive at the same time", async () => {
    // Regression: the Mini App fires concurrent /auth/telegram calls; each used to see "owns nothing".
    const logins = await Promise.all(Array.from({ length: 5 }, () => loginCollector(ctx.app, { id: 2003 })));
    const userId = logins[0].userId;

    expect(new Set(logins.map((l) => l.userId)).size).toBe(1);
    expect(await ctx.app.prisma.artwork.count({ where: { currentOwnerId: userId } })).toBe(3);
    expect(await ctx.app.prisma.artwork.count()).toBe(3);
  });

  it("is not granted again after the collector no longer owns any artwork", async () => {
    // Regression: the old check was "owns no artworks", so selling everything re-granted the set.
    const { userId } = await loginCollector(ctx.app, { id: 2004 });
    await ctx.app.prisma.artwork.updateMany({ where: { currentOwnerId: userId }, data: { currentOwnerId: null } });

    await loginCollector(ctx.app, { id: 2004 });

    expect(await ctx.app.prisma.artwork.count({ where: { currentOwnerId: userId } })).toBe(0);
    expect(await ctx.app.prisma.artwork.count()).toBe(3);
  });

  it("waits for an admin to exist and grants on the next login", async () => {
    await ctx.app.prisma.user.deleteMany({ where: { role: "ADMIN" } });
    const { userId } = await loginCollector(ctx.app, { id: 2005 });
    expect(await ctx.app.prisma.artwork.count({ where: { currentOwnerId: userId } })).toBe(0);

    await ctx.app.prisma.user.create({ data: { username: "admin2", displayName: "Admin", role: "ADMIN" } });
    await loginCollector(ctx.app, { id: 2005 });

    expect(await ctx.app.prisma.artwork.count({ where: { currentOwnerId: userId } })).toBe(3);
  });
});
