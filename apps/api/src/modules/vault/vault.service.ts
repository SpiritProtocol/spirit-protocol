import type { PrismaClient } from "@prisma/client";
import type { VaultDetailDto, VaultSummaryDto } from "@spirit/shared";
import { AppError } from "../../lib/errors.js";
import { toVaultEventDto, toVaultSummaryDto } from "../../mappers.js";
import type { VaultService } from "../../services/vault/index.js";
import type { ProvenanceService } from "../provenance/provenance.service.js";

/**
 * Read/admin surface over the swappable VaultService engine — resolves the
 * artwork side of `guaranteedFloor = value x coverage%` and mirrors coverage
 * changes into the artwork's provenance timeline.
 */
export class VaultModuleService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly vault: VaultService,
    private readonly provenance: ProvenanceService,
  ) {}

  async getDetail(artworkId: string): Promise<VaultDetailDto> {
    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) throw AppError.notFound("Artwork not found");

    const vaultRow = await this.prisma.vault.findUnique({ where: { artworkId } });
    const summary = toVaultSummaryDto(artwork, vaultRow);
    if (!summary) {
      throw AppError.notFound("This artwork's vault has not been activated yet (activates on verification approval)");
    }

    const events = vaultRow
      ? await this.prisma.vaultEvent.findMany({
          where: { vaultId: vaultRow.id },
          include: { performedBy: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    return {
      summary,
      events: events.map((event) => toVaultEventDto(event, event.performedBy)),
    };
  }

  async updateCoverage(artworkId: string, coveragePercent: number, actorId: string): Promise<VaultSummaryDto> {
    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) throw AppError.notFound("Artwork not found");

    await this.vault.updateCoverage({ artworkId, coveragePercent, actorId });

    await this.provenance.record({
      artworkId,
      type: "VAULT_COVERAGE_UPDATED",
      actorId,
      metadata: { coveragePercent },
    });

    const detail = await this.getDetail(artworkId);
    return detail.summary;
  }
}
