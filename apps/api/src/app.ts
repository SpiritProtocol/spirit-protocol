import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./env.js";
import { AppError } from "./lib/errors.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { artworksRoutes } from "./modules/artworks/artworks.routes.js";
import { collectionRoutes } from "./modules/collection/collection.routes.js";
import { demoRoutes } from "./modules/demo/demo.routes.js";
import { listingsRoutes } from "./modules/listings/listings.routes.js";
import { provenanceRoutes } from "./modules/provenance/provenance.routes.js";
import { purchasesRoutes } from "./modules/purchases/purchases.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { vaultRoutes } from "./modules/vault/vault.routes.js";
import { verificationsRoutes } from "./modules/verifications/verifications.routes.js";
import authPlugin from "./plugins/auth.js";
import domainPlugin from "./plugins/domain.js";
import prismaPlugin from "./plugins/prisma.js";
import servicesPlugin from "./plugins/services.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "test" ? "silent" : "info",
    },
  });

  await app.register(cors, { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") });

  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(servicesPlugin);
  await app.register(domainPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(artworksRoutes);
  await app.register(verificationsRoutes);
  await app.register(provenanceRoutes);
  await app.register(vaultRoutes);
  await app.register(listingsRoutes);
  await app.register(purchasesRoutes);
  await app.register(collectionRoutes);
  await app.register(usersRoutes);
  await app.register(demoRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
    }
    if (error instanceof ZodError) {
      return reply
        .status(400)
        .send({ error: { code: "VALIDATION_ERROR", message: "Invalid request", issues: error.issues } });
    }
    app.log.error(error);
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
  });

  return app;
}
