import type { FastifyInstance } from "fastify";
import { adminLoginSchema, telegramAuthSchema } from "@spirit/shared";
import { AuthService } from "./auth.service.js";

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, (payload) => fastify.jwt.sign(payload, { expiresIn: "12h" }));

  fastify.post("/auth/telegram", async (request, reply) => {
    const body = telegramAuthSchema.parse(request.body);
    const result = await authService.loginWithTelegram(body.initData);
    return reply.send(result);
  });

  fastify.post("/auth/admin/login", async (request, reply) => {
    const body = adminLoginSchema.parse(request.body);
    const result = await authService.loginAsAdmin(body.username, body.password);
    return reply.send(result);
  });

  fastify.get("/auth/me", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await authService.me(request.currentUser!.sub);
    return reply.send(user);
  });
}
