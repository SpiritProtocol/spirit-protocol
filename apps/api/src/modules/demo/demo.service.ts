import type { PrismaClient } from "@prisma/client";
import type { DemoOperationLogDto } from "@spirit/shared";
import { toDemoOperationLogDto } from "../../mappers.js";
import type { ArtworksService } from "../artworks/artworks.service.js";
import type { ListingsService } from "../listings/listings.service.js";
import type { PurchasesService } from "../purchases/purchases.service.js";
import type { VerificationsService } from "../verifications/verifications.service.js";
import { INVESTOR_DEMO_ARTWORKS, INVESTOR_DEMO_USERS } from "./fixtures/investor-demo.js";

export class DemoService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly artworks: ArtworksService,
    private readonly verifications: VerificationsService,
    private readonly listings: ListingsService,
    private readonly purchases: PurchasesService,
  ) {}

  async seed(actorId: string, datasetName = "investor-demo"): Promise<DemoOperationLogDto> {
    const usersByUsername = await this.ensureDemoUsers();

    for (const fixture of INVESTOR_DEMO_ARTWORKS) {
      const owner = usersByUsername[fixture.ownerUsername];
      const ownerActor = { id: owner.id, role: "COLLECTOR" as const };

      const created = await this.artworks.create(
        {
          title: fixture.title,
          artist: fixture.artist,
          year: fixture.year,
          medium: fixture.medium,
          description: fixture.description,
          value: fixture.value,
          images: fixture.images,
          ownerId: owner.id,
        },
        actorId,
      );

      const record = await this.verifications.start(created.id, ownerActor);
      if (fixture.targetStatus === "PENDING_VERIFICATION") continue;

      await this.verifications.approve(record.id, actorId);
      if (fixture.targetStatus === "VERIFIED") continue;

      const listing = await this.listings.create(
        { artworkId: created.id, price: fixture.listPrice ?? fixture.value, currency: "USD" },
        ownerActor,
      );
      if (fixture.targetStatus === "LISTED") continue;

      // SOLD: run the artwork through a completed mock purchase so provenance shows a real resale.
      const buyerUsername = fixture.buyerUsername ?? Object.keys(usersByUsername).find((u) => u !== fixture.ownerUsername)!;
      const buyer = usersByUsername[buyerUsername];
      const tx = await this.purchases.initiate(listing.id, buyer.id);
      await this.purchases.confirm(tx.id, buyer.id);
    }

    return this.logOperation("SEED", actorId, datasetName);
  }

  async clear(actorId: string): Promise<DemoOperationLogDto> {
    await this.prisma.$transaction([
      this.prisma.vaultEvent.deleteMany({}),
      this.prisma.vault.deleteMany({}),
      this.prisma.provenanceEvent.deleteMany({}),
      this.prisma.transaction.deleteMany({}),
      this.prisma.listing.deleteMany({}),
      this.prisma.verificationRecord.deleteMany({}),
      this.prisma.artworkImage.deleteMany({}),
      this.prisma.artwork.deleteMany({}),
    ]);

    return this.logOperation("CLEAR", actorId, null);
  }

  async reset(actorId: string, datasetName = "investor-demo"): Promise<DemoOperationLogDto> {
    await this.clear(actorId);
    await this.seed(actorId, datasetName);
    return this.logOperation("RESET", actorId, datasetName);
  }

  async listLogs(): Promise<DemoOperationLogDto[]> {
    const logs = await this.prisma.demoOperationLog.findMany({
      include: { performedBy: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return logs.map(toDemoOperationLogDto);
  }

  private async ensureDemoUsers(): Promise<Record<string, { id: string }>> {
    const map: Record<string, { id: string }> = {};
    for (const fixtureUser of INVESTOR_DEMO_USERS) {
      const user = await this.prisma.user.upsert({
        where: { username: fixtureUser.username },
        create: { username: fixtureUser.username, displayName: fixtureUser.displayName, role: "COLLECTOR" },
        update: {},
      });
      map[fixtureUser.username] = user;
    }
    return map;
  }

  private async logOperation(
    operation: "SEED" | "RESET" | "CLEAR",
    actorId: string,
    datasetName: string | null,
  ): Promise<DemoOperationLogDto> {
    const log = await this.prisma.demoOperationLog.create({
      data: { operation, datasetName, performedById: actorId },
      include: { performedBy: true },
    });
    return toDemoOperationLogDto(log);
  }
}
