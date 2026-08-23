import type { FastifyInstance } from "fastify";
import { confirmPurchaseSchema, initiatePurchaseSchema } from "@spirit/shared";

export async function purchasesRoutes(fastify: FastifyInstance) {
  const { purchases } = fastify.domain;

  fastify.post("/purchases", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = initiatePurchaseSchema.parse(request.body);
    const result = await purchases.initiate(body.listingId, request.currentUser!.sub);
    return reply.status(201).send(result);
  });

  fastify.post("/purchases/confirm", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = confirmPurchaseSchema.parse(request.body);
    const result = await purchases.confirm(body.transactionId, request.currentUser!.sub);
    return reply.send(result);
  });

  fastify.get(
    "/admin/transactions",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (_request, reply) => {
      const result = await purchases.listAll();
      return reply.send(result);
    },
  );
}
