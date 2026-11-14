import { describe, expect, it } from "vitest";
import { api, createDraftArtwork, loginCollector, useTestApp } from "./helpers.js";

describe("provenance", () => {
  const ctx = useTestApp();

  it("records the full life of an artwork as events in order", async () => {
    const owner = await loginCollector(ctx.app, { id: 5001 });
    const buyer = await loginCollector(ctx.app, { id: 5002 });
    const artworkId = await createDraftArtwork(ctx.app, ctx.adminToken, owner.userId);

    const started = await api(ctx.app, "POST", "/verifications", owner.token, { artworkId });
    await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {});
    const listing = await api(ctx.app, "POST", "/listings", owner.token, { artworkId, price: 1200 });
    const tx = await api(ctx.app, "POST", "/purchases", buyer.token, { listingId: listing.body.id });
    await api(ctx.app, "POST", "/purchases/confirm", buyer.token, { transactionId: tx.body.id });

    const res = await api(ctx.app, "GET", `/provenance/${artworkId}`, owner.token);

    expect(res.status).toBe(200);
    expect(res.body.map((e: { type: string }) => e.type)).toEqual([
      "CREATED",
      "VERIFICATION_STARTED",
      "VERIFIED",
      "LISTED",
      "SOLD",
    ]);
  });

  it("keeps insertion order even when events share a timestamp", async () => {
    // createdAt has millisecond precision; the API must order by the append sequence instead.
    const owner = await loginCollector(ctx.app, { id: 5003 });
    const artworkId = await createDraftArtwork(ctx.app, ctx.adminToken, owner.userId);
    const sameMoment = new Date("2026-01-01T00:00:00.000Z");
    for (const type of ["LISTED", "LISTING_CANCELLED", "LISTED"] as const) {
      await ctx.app.prisma.provenanceEvent.create({ data: { artworkId, type, createdAt: sameMoment } });
    }

    const res = await api(ctx.app, "GET", `/provenance/${artworkId}`, owner.token);

    // CREATED was written "now", after the fixed past timestamp, yet it comes first by sequence.
    expect(res.body.map((e: { type: string }) => e.type)).toEqual(["CREATED", "LISTED", "LISTING_CANCELLED", "LISTED"]);
  });

  it("only appends: earlier events stay unchanged as the artwork moves on", async () => {
    const owner = await loginCollector(ctx.app, { id: 5004 });
    const artworkId = await createDraftArtwork(ctx.app, ctx.adminToken, owner.userId);
    const before = await ctx.app.prisma.provenanceEvent.findMany({ where: { artworkId }, orderBy: { seq: "asc" } });

    const started = await api(ctx.app, "POST", "/verifications", owner.token, { artworkId });
    await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {});

    const after = await ctx.app.prisma.provenanceEvent.findMany({ where: { artworkId }, orderBy: { seq: "asc" } });
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.length).toBe(before.length + 2);
  });
});
