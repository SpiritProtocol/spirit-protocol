import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createListingSchema, updateListingSchema } from "@spirit/shared";
import { actorFromRequest } from "../../lib/request.js";

const listQuerySchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED"]).default("ACTIVE"),
});

export async function listingsRoutes(fastify: FastifyInstance) {
  const { listings } = fastify.domain;

  fastify.get("/listings", { preHandler: fastify.authenticate }, async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const result = await listings.list(query.status);
    return reply.send(result);
  });

  fastify.get("/listings/:id", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await listings.getById(id);
    return reply.send(result);
  });

  fastify.post("/listings", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = createListingSchema.parse(request.body);
    const result = await listings.create(body, actorFromRequest(request));
    return reply.status(201).send(result);
  });

  fastify.patch("/listings/:id", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateListingSchema.parse(request.body);
    const result = await listings.update(id, body, actorFromRequest(request));
    return reply.send(result);
  });
}
