import type { FastifyInstance } from "fastify";
import type { CollectionDto } from "@spirit/shared";

export async function collectionRoutes(fastify: FastifyInstance) {
  const { artworks, purchases } = fastify.domain;

  fastify.get("/collection", { preHandler: fastify.authenticate }, async (request, reply) => {
    const userId = request.currentUser!.sub;
    const [ownedArtworks, transactions] = await Promise.all([
      artworks.list({ ownerId: userId }),
      purchases.listForUser(userId),
    ]);
    const result: CollectionDto = { artworks: ownedArtworks, transactions };
    return reply.send(result);
  });
}
