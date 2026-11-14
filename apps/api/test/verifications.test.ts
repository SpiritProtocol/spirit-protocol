import { describe, expect, it } from "vitest";
import { api, createDraftArtwork, loginCollector, useTestApp } from "./helpers.js";

describe("verification", () => {
  const ctx = useTestApp();

  async function ownerWithDraft(telegramId: number) {
    const owner = await loginCollector(ctx.app, { id: telegramId });
    const artworkId = await createDraftArtwork(ctx.app, ctx.adminToken, owner.userId);
    return { ...owner, artworkId };
  }

  async function artworkStatus(artworkId: string) {
    return (await ctx.app.prisma.artwork.findUniqueOrThrow({ where: { id: artworkId } })).status;
  }

  it("owner starts verification: record IN_REVIEW, artwork PENDING_VERIFICATION", async () => {
    const { token, artworkId } = await ownerWithDraft(3001);

    const res = await api(ctx.app, "POST", "/verifications", token, { artworkId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("IN_REVIEW");
    expect(await artworkStatus(artworkId)).toBe("PENDING_VERIFICATION");
  });

  it("only the owner or an admin can start verification", async () => {
    const { artworkId } = await ownerWithDraft(3002);
    const stranger = await loginCollector(ctx.app, { id: 3003 });

    expect((await api(ctx.app, "POST", "/verifications", stranger.token, { artworkId })).status).toBe(403);
    expect((await api(ctx.app, "POST", "/verifications", ctx.adminToken, { artworkId })).status).toBe(201);
  });

  it("cannot be started twice while the first request is still in review", async () => {
    // Regression: a second start used to create a second IN_REVIEW record.
    const { token, artworkId } = await ownerWithDraft(3004);
    await api(ctx.app, "POST", "/verifications", token, { artworkId });

    const again = await api(ctx.app, "POST", "/verifications", token, { artworkId });

    expect(again.status).toBe(409);
    expect(await ctx.app.prisma.verificationRecord.count({ where: { artworkId } })).toBe(1);
  });

  it("admin approves: record APPROVED, artwork VERIFIED with a chip id", async () => {
    const { token, artworkId } = await ownerWithDraft(3005);
    const started = await api(ctx.app, "POST", "/verifications", token, { artworkId });

    const res = await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
    const artwork = await ctx.app.prisma.artwork.findUniqueOrThrow({ where: { id: artworkId } });
    expect(artwork.status).toBe("VERIFIED");
    expect(artwork.chipId).toBeTruthy();
  });

  it("collectors cannot approve or reject, even their own artwork", async () => {
    const { token, artworkId } = await ownerWithDraft(3006);
    const started = await api(ctx.app, "POST", "/verifications", token, { artworkId });

    expect((await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, token, {})).status).toBe(403);
    expect((await api(ctx.app, "POST", `/verifications/${started.body.id}/reject`, token, {})).status).toBe(403);
    expect(await artworkStatus(artworkId)).toBe("PENDING_VERIFICATION");
  });

  it("a reviewed request cannot be reviewed again", async () => {
    const { token, artworkId } = await ownerWithDraft(3007);
    const started = await api(ctx.app, "POST", `/verifications`, token, { artworkId });
    await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {});

    expect((await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {})).status).toBe(409);
    expect((await api(ctx.app, "POST", `/verifications/${started.body.id}/reject`, ctx.adminToken, {})).status).toBe(409);
    expect(await artworkStatus(artworkId)).toBe("VERIFIED");
  });

  it("a verified artwork cannot be sent to verification again", async () => {
    const { token, artworkId } = await ownerWithDraft(3008);
    const started = await api(ctx.app, "POST", "/verifications", token, { artworkId });
    await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {});

    expect((await api(ctx.app, "POST", "/verifications", token, { artworkId })).status).toBe(409);
  });

  it("after a rejection the owner can resubmit", async () => {
    const { token, artworkId } = await ownerWithDraft(3009);
    const first = await api(ctx.app, "POST", "/verifications", token, { artworkId });
    await api(ctx.app, "POST", `/verifications/${first.body.id}/reject`, ctx.adminToken, { notes: "Blurry photos" });
    expect(await artworkStatus(artworkId)).toBe("REJECTED");

    const second = await api(ctx.app, "POST", "/verifications", token, { artworkId });

    expect(second.status).toBe(201);
    expect(await artworkStatus(artworkId)).toBe("PENDING_VERIFICATION");
  });

  it("verification status does not change ownership", async () => {
    const { token, userId, artworkId } = await ownerWithDraft(3010);
    const started = await api(ctx.app, "POST", "/verifications", token, { artworkId });
    await api(ctx.app, "POST", `/verifications/${started.body.id}/approve`, ctx.adminToken, {});

    const artwork = await ctx.app.prisma.artwork.findUniqueOrThrow({ where: { id: artworkId } });
    expect(artwork.currentOwnerId).toBe(userId);
  });
});
