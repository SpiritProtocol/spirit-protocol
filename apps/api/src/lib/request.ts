import type { FastifyRequest } from "fastify";

/** Maps the JWT payload (sub/role) to the {id, role} actor shape the domain services expect. */
export function actorFromRequest(request: FastifyRequest): { id: string; role: import("@spirit/shared").UserRole } {
  const user = request.currentUser!;
  return { id: user.sub, role: user.role };
}
