import type { FastifyInstance } from "fastify";
import { seedDemoSchema } from "@spirit/shared";

export async function demoRoutes(fastify: FastifyInstance) {
  const { demo } = fastify.domain;
  const adminOnly = [fastify.authenticate, fastify.requireRole("ADMIN")];

  fastify.post("/admin/demo/seed", { preHandler: adminOnly }, async (request, reply) => {
    const body = seedDemoSchema.parse(request.body ?? {});
    const result = await demo.seed(request.currentUser!.sub, body.dataset);
    return reply.send(result);
  });

  fastify.post("/admin/demo/reset", { preHandler: adminOnly }, async (request, reply) => {
    const body = seedDemoSchema.parse(request.body ?? {});
    const result = await demo.reset(request.currentUser!.sub, body.dataset);
    return reply.send(result);
  });

  fastify.post("/admin/demo/clear", { preHandler: adminOnly }, async (request, reply) => {
    const result = await demo.clear(request.currentUser!.sub);
    return reply.send(result);
  });

  fastify.get("/admin/demo/logs", { preHandler: adminOnly }, async (_request, reply) => {
    const result = await demo.listLogs();
    return reply.send(result);
  });
}
