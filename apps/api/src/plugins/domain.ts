import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { ArtworksService } from "../modules/artworks/artworks.service.js";
import { DemoService } from "../modules/demo/demo.service.js";
import { ListingsService } from "../modules/listings/listings.service.js";
import { ProvenanceService } from "../modules/provenance/provenance.service.js";
import { PurchasesService } from "../modules/purchases/purchases.service.js";
import { VerificationsService } from "../modules/verifications/verifications.service.js";

export interface Domain {
  provenance: ProvenanceService;
  artworks: ArtworksService;
  verifications: VerificationsService;
  listings: ListingsService;
  purchases: PurchasesService;
  demo: DemoService;
}

declare module "fastify" {
  interface FastifyInstance {
    domain: Domain;
  }
}

/** Wires the module-level business services on top of the (already-registered) prisma + swappable services plugins. */
export default fp(
  async function domainPlugin(fastify: FastifyInstance) {
    const { prisma, services } = fastify;

    const provenance = new ProvenanceService(prisma);
    const artworks = new ArtworksService(prisma, provenance, services.blockchain);
    const verifications = new VerificationsService(prisma, provenance, services.hardwareVerification);
    const listings = new ListingsService(prisma, provenance);
    const purchases = new PurchasesService(prisma, provenance, services.payment, services.blockchain);
    const demo = new DemoService(prisma, artworks, verifications, listings, purchases);

    fastify.decorate("domain", {
      provenance,
      artworks,
      verifications,
      listings,
      purchases,
      demo,
    } satisfies Domain);
  },
  { dependencies: ["prisma-plugin", "services-plugin"] },
);
