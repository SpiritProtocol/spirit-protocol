import type { FastifyInstance } from "fastify";
import { toUserDto } from "../../mappers.js";

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/admin/users",
    { preHandler: [fastify.authenticate, fastify.requireRole("ADMIN")] },
    async (_request, reply) => {
      const users = await fastify.prisma.user.findMany({ orderBy: { createdAt: "asc" } });
      return reply.send(users.map(toUserDto));
    },
  );
}
