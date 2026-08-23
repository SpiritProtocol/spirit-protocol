import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { updateVaultCoverageSchema } from "@spirit/shared";

export async function vaultRoutes(fastify: FastifyInstance) {
  const { vault } = fastify.domain;

  fastify.get("/vaults/:artworkId", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { artworkId } = z.object({ artworkId: z.string().uuid() }).parse(request.params);
    const result = await vault.getDetail(artworkId);
    return reply.send(result);
  });

  fastify.patch(
    "/admin/vaults/:artworkId/coverage",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const { artworkId } = z.object({ artworkId: z.string().uuid() }).parse(request.params);
      const body = updateVaultCoverageSchema.parse(request.body);
      const result = await vault.updateCoverage(artworkId, body.coveragePercent, request.currentUser!.sub);
      return reply.send(result);
    },
  );
}
