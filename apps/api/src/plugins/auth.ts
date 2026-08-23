import jwtPlugin from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@spirit/shared";
import { env } from "../env.js";
import { AppError } from "../lib/errors.js";

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    currentUser?: JwtPayload;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(jwtPlugin, { secret: env.JWT_SECRET });

  fastify.decorate("authenticate", async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      request.currentUser = request.user;
    } catch {
      throw AppError.unauthorized("Missing or invalid authentication token");
    }
  });

  fastify.decorate("requireRole", (...roles: UserRole[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!request.currentUser) {
        throw AppError.unauthorized();
      }
      if (!roles.includes(request.currentUser.role)) {
        throw AppError.forbidden("You do not have permission to perform this action");
      }
    };
  });
});
