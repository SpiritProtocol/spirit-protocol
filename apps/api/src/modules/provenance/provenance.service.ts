import type { Prisma, PrismaClient } from "@prisma/client";
import type { ProvenanceEventDto, ProvenanceEventType } from "@spirit/shared";
import { toProvenanceEventDto } from "../../mappers.js";

export interface RecordProvenanceEventInput {
  artworkId: string;
  type: ProvenanceEventType;
  fromOwnerId?: string | null;
  toOwnerId?: string | null;
  listingId?: string | null;
  transactionId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}

export class ProvenanceService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Appends an event to an artwork's immutable provenance log. Never update/delete — history-only. */
  async record(input: RecordProvenanceEventInput) {
    return this.prisma.provenanceEvent.create({
      data: {
        artworkId: input.artworkId,
        type: input.type,
        fromOwnerId: input.fromOwnerId ?? null,
        toOwnerId: input.toOwnerId ?? null,
        listingId: input.listingId ?? null,
        transactionId: input.transactionId ?? null,
        actorId: input.actorId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async listForArtwork(artworkId: string): Promise<ProvenanceEventDto[]> {
    const events = await this.prisma.provenanceEvent.findMany({
      where: { artworkId },
      orderBy: { createdAt: "asc" },
    });

    const userIds = new Set<string>();
    for (const event of events) {
      if (event.fromOwnerId) userIds.add(event.fromOwnerId);
      if (event.toOwnerId) userIds.add(event.toOwnerId);
      if (event.actorId) userIds.add(event.actorId);
    }

    const users = userIds.size
      ? await this.prisma.user.findMany({ where: { id: { in: [...userIds] } } })
      : [];
    const usersById = new Map(users.map((user) => [user.id, user]));

    return events.map((event) => toProvenanceEventDto(event, usersById));
  }
}
