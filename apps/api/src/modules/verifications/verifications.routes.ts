import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { reviewVerificationSchema, startVerificationSchema } from "@spirit/shared";
import { actorFromRequest } from "../../lib/request.js";

export async function verificationsRoutes(fastify: FastifyInstance) {
  const { verifications } = fastify.domain;

  fastify.post("/verifications", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = startVerificationSchema.parse(request.body);
    const result = await verifications.start(body.artworkId, actorFromRequest(request));
    return reply.status(201).send(result);
  });

  fastify.get(
    "/verifications/pending",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (_request, reply) => {
      const result = await verifications.listPending();
      return reply.send(result);
    },
  );

  fastify.get(
    "/verifications/artwork/:artworkId",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { artworkId } = z.object({ artworkId: z.string().uuid() }).parse(request.params);
      const result = await verifications.historyForArtwork(artworkId);
      return reply.send(result);
    },
  );

  fastify.post(
    "/verifications/:id/approve",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = reviewVerificationSchema.parse(request.body ?? {});
      const result = await verifications.approve(id, request.currentUser!.sub, body.notes);
      return reply.send(result);
    },
  );

  fastify.post(
    "/verifications/:id/reject",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = reviewVerificationSchema.parse(request.body ?? {});
      const result = await verifications.reject(id, request.currentUser!.sub, body.notes);
      return reply.send(result);
    },
  );
}
