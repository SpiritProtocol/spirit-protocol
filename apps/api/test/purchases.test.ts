import { describe, expect, it } from "vitest";
import { api, collectorWithArtwork, createDraftArtwork, loginCollector, useTestApp } from "./helpers.js";

describe("listing and purchase", () => {
  const ctx = useTestApp();

  async function listedArtwork(telegramId: number, price = 5000) {
    const seller = await collectorWithArtwork(ctx.app, telegramId);
    const listing = await api(ctx.app, "POST", "/listings", seller.token, {
      artworkId: seller.artworkId,
      price,
      currency: "USD",
    });
    expect(listing.status).toBe(201);
    return { seller, listingId: listing.body.id as string, artworkId: seller.artworkId };
  }

  async function buy(token: string, listingId: string) {
    const initiated = await api(ctx.app, "POST", "/purchases", token, { listingId });
    expect(initiated.status).toBe(201);
    return initiated.body.id as string;
  }

  async function artwork(id: string) {
    return ctx.app.prisma.artwork.findUniqueOrThrow({ where: { id } });
  }

  it("owner lists a verified artwork: listing ACTIVE, artwork LISTED", async () => {
    const { listingId, artworkId } = await listedArtwork(4001);

    expect((await ctx.app.prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).status).toBe("ACTIVE");
    expect((await artwork(artworkId)).status).toBe("LISTED");
  });

  it("only the owner can list, and only a verified artwork", async () => {
    const owner = await collectorWithArtwork(ctx.app, 4002);
    const stranger = await loginCollector(ctx.app, { id: 4003 });
    const draftId = await createDraftArtwork(ctx.app, ctx.adminToken, owner.userId);

    const byStranger = await api(ctx.app, "POST", "/listings", stranger.token, { artworkId: owner.artworkId, price: 100 });
    const draft = await api(ctx.app, "POST", "/listings", owner.token, { artworkId: draftId, price: 100 });

    expect(byStranger.status).toBe(403);
    expect(draft.status).toBe(409);
  });

  it("a completed purchase moves ownership, sells the listing and records provenance", async () => {
    const { seller, listingId, artworkId } = await listedArtwork(4004, 7500);
    const buyer = await loginCollector(ctx.app, { id: 4005 });

    const txId = await buy(buyer.token, listingId);
    expect((await ctx.app.prisma.transaction.findUniqueOrThrow({ where: { id: txId } })).status).toBe("PENDING");
    expect((await artwork(artworkId)).currentOwnerId).toBe(seller.userId);

    const confirmed = await api(ctx.app, "POST", "/purchases/confirm", buyer.token, { transactionId: txId });

    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe("COMPLETED");
    const after = await artwork(artworkId);
    expect(after.currentOwnerId).toBe(buyer.userId);
    expect(after.status).toBe("VERIFIED");
    expect((await ctx.app.prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).status).toBe("SOLD");
    const sold = await ctx.app.prisma.provenanceEvent.findFirstOrThrow({ where: { artworkId, type: "SOLD" } });
    expect(sold).toMatchObject({ fromOwnerId: seller.userId, toOwnerId: buyer.userId, transactionId: txId });
  });

  it("the new owner can relist the artwork they bought", async () => {
    const { listingId, artworkId } = await listedArtwork(4006);
    const buyer = await loginCollector(ctx.app, { id: 4007 });
    const txId = await buy(buyer.token, listingId);
    await api(ctx.app, "POST", "/purchases/confirm", buyer.token, { transactionId: txId });

    const relist = await api(ctx.app, "POST", "/listings", buyer.token, { artworkId, price: 9000 });

    expect(relist.status).toBe(201);
  });

  it("a seller cannot buy their own listing", async () => {
    const { seller, listingId } = await listedArtwork(4008);

    const res = await api(ctx.app, "POST", "/purchases", seller.token, { listingId });

    expect(res.status).toBe(409);
  });

  it("nobody else can confirm the buyer's transaction", async () => {
    const { listingId, artworkId, seller } = await listedArtwork(4009);
    const buyer = await loginCollector(ctx.app, { id: 4010 });
    const stranger = await loginCollector(ctx.app, { id: 4011 });
    const txId = await buy(buyer.token, listingId);

    expect((await api(ctx.app, "POST", "/purchases/confirm", stranger.token, { transactionId: txId })).status).toBe(403);
    expect((await api(ctx.app, "POST", "/purchases/confirm", seller.token, { transactionId: txId })).status).toBe(403);
    expect((await artwork(artworkId)).currentOwnerId).toBe(seller.userId);
  });

  it("a transaction cannot be confirmed twice", async () => {
    const { listingId } = await listedArtwork(4012);
    const buyer = await loginCollector(ctx.app, { id: 4013 });
    const txId = await buy(buyer.token, listingId);
    await api(ctx.app, "POST", "/purchases/confirm", buyer.token, { transactionId: txId });

    const again = await api(ctx.app, "POST", "/purchases/confirm", buyer.token, { transactionId: txId });

    expect(again.status).toBe(409);
    expect(await ctx.app.prisma.provenanceEvent.count({ where: { type: "SOLD" } })).toBe(1);
  });

  it("when two buyers start a purchase, only the first to confirm gets the artwork", async () => {
    // Regression: confirm() didn't re-check the listing, so the second buyer also "bought" it.
    const { listingId, artworkId } = await listedArtwork(4014);
    const first = await loginCollector(ctx.app, { id: 4015 });
    const second = await loginCollector(ctx.app, { id: 4016 });
    const firstTx = await buy(first.token, listingId);
    const secondTx = await buy(second.token, listingId);

    expect((await api(ctx.app, "POST", "/purchases/confirm", first.token, { transactionId: firstTx })).status).toBe(200);
    const late = await api(ctx.app, "POST", "/purchases/confirm", second.token, { transactionId: secondTx });

    expect(late.status).toBe(409);
    expect((await artwork(artworkId)).currentOwnerId).toBe(first.userId);
    expect((await ctx.app.prisma.transaction.findUniqueOrThrow({ where: { id: secondTx } })).status).toBe("CANCELLED");
    expect(await ctx.app.prisma.provenanceEvent.count({ where: { type: "SOLD" } })).toBe(1);
  });

  it("concurrent confirmations of two buyers produce exactly one sale", async () => {
    const { listingId, artworkId } = await listedArtwork(4017);
    const buyers = await Promise.all([4018, 4019, 4020].map((id) => loginCollector(ctx.app, { id })));
    const txIds = await Promise.all(buyers.map((b) => buy(b.token, listingId)));

    const results = await Promise.all(
      buyers.map((b, i) => api(ctx.app, "POST", "/purchases/confirm", b.token, { transactionId: txIds[i] })),
    );

    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(2);
    const winner = buyers[results.findIndex((r) => r.status === 200)];
    expect((await artwork(artworkId)).currentOwnerId).toBe(winner.userId);
    expect(await ctx.app.prisma.transaction.count({ where: { status: "COMPLETED" } })).toBe(1);
  });

  it("a purchase cannot complete after the seller cancels the listing", async () => {
    // Regression: a pending transaction used to complete even on a CANCELLED listing.
    const { seller, listingId, artworkId } = await listedArtwork(4021);
    const buyer = await loginCollector(ctx.app, { id: 4022 });
    const txId = await buy(buyer.token, listingId);

    const cancel = await api(ctx.app, "PATCH", `/listings/${listingId}`, seller.token, { status: "CANCELLED" });
    expect(cancel.status).toBe(200);
    expect((await artwork(artworkId)).status).toBe("VERIFIED");

    const confirm = await api(ctx.app, "POST", "/purchases/confirm", buyer.token, { transactionId: txId });

    expect(confirm.status).toBe(409);
    expect((await artwork(artworkId)).currentOwnerId).toBe(seller.userId);
    expect((await ctx.app.prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).status).toBe("CANCELLED");
  });

  it("only the seller can cancel a listing", async () => {
    const { listingId } = await listedArtwork(4023);
    const stranger = await loginCollector(ctx.app, { id: 4024 });

    const res = await api(ctx.app, "PATCH", `/listings/${listingId}`, stranger.token, { status: "CANCELLED" });

    expect(res.status).toBe(403);
  });
});
