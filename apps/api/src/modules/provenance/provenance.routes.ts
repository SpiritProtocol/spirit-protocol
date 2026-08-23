import type { FastifyInstance } from "fastify";
import { z } from "zod";

export async function provenanceRoutes(fastify: FastifyInstance) {
  const { provenance } = fastify.domain;

  fastify.get("/provenance/:artworkId", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { artworkId } = z.object({ artworkId: z.string().uuid() }).parse(request.params);
    const result = await provenance.listForArtwork(artworkId);
    return reply.send(result);
  });
}
