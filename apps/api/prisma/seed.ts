import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../src/env.js";
import { ArtworksService } from "../src/modules/artworks/artworks.service.js";
import { DemoService } from "../src/modules/demo/demo.service.js";
import { ListingsService } from "../src/modules/listings/listings.service.js";
import { ProvenanceService } from "../src/modules/provenance/provenance.service.js";
import { PurchasesService } from "../src/modules/purchases/purchases.service.js";
import { VerificationsService } from "../src/modules/verifications/verifications.service.js";
import { createBlockchainService } from "../src/services/blockchain/index.js";
import { createHardwareVerificationService } from "../src/services/hardware-verification/index.js";
import { createPaymentService } from "../src/services/payment/index.js";
import { createVaultService } from "../src/services/vault/index.js";

async function main() {
  const prisma = new PrismaClient();

  const admin = await prisma.user.upsert({
    where: { username: env.ADMIN_DEFAULT_USERNAME },
    create: {
      username: env.ADMIN_DEFAULT_USERNAME,
      displayName: "Spirit Protocol Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(env.ADMIN_DEFAULT_PASSWORD, 10),
    },
    update: {},
  });

  const provenance = new ProvenanceService(prisma);
  const blockchain = createBlockchainService();
  const hardwareVerification = createHardwareVerificationService();
  const vault = createVaultService(prisma);
  const payment = createPaymentService();

  const artworks = new ArtworksService(prisma, provenance, blockchain, vault);
  const verifications = new VerificationsService(prisma, provenance, hardwareVerification, vault);
  const listings = new ListingsService(prisma, provenance);
  const purchases = new PurchasesService(prisma, provenance, payment, blockchain);
  const demo = new DemoService(prisma, artworks, verifications, listings, purchases);

  const existingArtworks = await prisma.artwork.count();
  if (existingArtworks === 0) {
    await demo.seed(admin.id);
    console.log("Seeded investor demo dataset.");
  } else {
    console.log("Artworks already present, skipping demo seed (use the admin panel's Reset instead).");
  }

  console.log(`Admin login: ${env.ADMIN_DEFAULT_USERNAME} / ${env.ADMIN_DEFAULT_PASSWORD}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
