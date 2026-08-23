import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  assignOwnerSchema,
  changeArtworkStatusSchema,
  createArtworkSchema,
  updateArtworkSchema,
} from "@spirit/shared";

const listQuerySchema = z.object({
  status: z
    .enum(["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "LISTED", "SOLD", "ARCHIVED"])
    .optional(),
  ownerId: z.string().uuid().optional(),
});

export async function artworksRoutes(fastify: FastifyInstance) {
  const { artworks } = fastify.domain;

  fastify.get("/artworks", { preHandler: fastify.authenticate }, async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const result = await artworks.list(query);
    return reply.send(result);
  });

  fastify.get("/artworks/:id", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await artworks.getById(id);
    return reply.send(result);
  });

  fastify.post(
    "/artworks",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const body = createArtworkSchema.parse(request.body);
      const result = await artworks.create(body, request.currentUser!.sub);
      return reply.status(201).send(result);
    },
  );

  fastify.patch(
    "/artworks/:id",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = updateArtworkSchema.parse(request.body);
      const result = await artworks.update(id, body, request.currentUser!.sub);
      return reply.send(result);
    },
  );

  fastify.patch(
    "/artworks/:id/status",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = changeArtworkStatusSchema.parse(request.body);
      const result = await artworks.changeStatus(id, body.status, request.currentUser!.sub);
      return reply.send(result);
    },
  );

  fastify.patch(
    "/artworks/:id/owner",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = assignOwnerSchema.parse(request.body);
      const result = await artworks.assignOwner(id, body.ownerId, request.currentUser!.sub);
      return reply.send(result);
    },
  );
}
