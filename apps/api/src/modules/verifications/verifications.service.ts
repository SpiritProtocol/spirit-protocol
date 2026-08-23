import type { PrismaClient } from "@prisma/client";
import type { UserRole, VerificationRecordDto } from "@spirit/shared";
import { AppError } from "../../lib/errors.js";
import { toVerificationRecordDto } from "../../mappers.js";
import type { HardwareVerificationService } from "../../services/hardware-verification/index.js";
import type { VaultService } from "../../services/vault/index.js";
import type { ProvenanceService } from "../provenance/provenance.service.js";

export class VerificationsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provenance: ProvenanceService,
    private readonly hardwareVerification: HardwareVerificationService,
    private readonly vault: VaultService,
  ) {}

  /** Kicks off verification: simulates an NFC tap/scan, records the result, and moves the artwork into review. */
  async start(artworkId: string, actor: { id: string; role: UserRole }): Promise<VerificationRecordDto> {
    const artwork = await this.prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) throw AppError.notFound("Artwork not found");
    if (artwork.status === "VERIFIED" || artwork.status === "LISTED" || artwork.status === "SOLD") {
      throw AppError.conflict("This artwork is already verified");
    }
    if (artwork.currentOwnerId !== actor.id && actor.role !== "ADMIN") {
      throw AppError.forbidden("Only the current owner or an admin can start verification");
    }
    const actorId = actor.id;

    const scan = await this.hardwareVerification.verify({ artworkId, spiritId: artwork.spiritId });

    const record = await this.prisma.verificationRecord.create({
      data: {
        artworkId,
        status: "IN_REVIEW",
        submittedById: actorId,
        resultPayload: scan as unknown as object,
      },
      include: { submittedBy: true, reviewedBy: true },
    });

    await this.prisma.artwork.update({ where: { id: artworkId }, data: { status: "PENDING_VERIFICATION" } });

    await this.provenance.record({
      artworkId,
      type: "VERIFICATION_STARTED",
      actorId,
      metadata: { chipId: scan.chipId, tamperDetected: scan.tamperDetected },
    });

    return toVerificationRecordDto(record);
  }

  async approve(verificationId: string, actorId: string, notes?: string): Promise<VerificationRecordDto> {
    const record = await this.requireInReview(verificationId);

    const updated = await this.prisma.verificationRecord.update({
      where: { id: verificationId },
      data: { status: "APPROVED", reviewedById: actorId, notes },
      include: { submittedBy: true, reviewedBy: true },
    });

    const scan = record.resultPayload as { chipId?: string } | null;

    await this.prisma.artwork.update({
      where: { id: record.artworkId },
      data: { status: "VERIFIED", chipId: scan?.chipId ?? undefined },
    });

    await this.provenance.record({
      artworkId: record.artworkId,
      type: "VERIFIED",
      actorId,
      metadata: { chipId: scan?.chipId ?? null, notes: notes ?? null },
    });

    const vaultState = await this.vault.initializeVault({ artworkId: record.artworkId });

    await this.provenance.record({
      artworkId: record.artworkId,
      type: "VAULT_ACTIVATED",
      actorId,
      metadata: { coveragePercent: vaultState.coveragePercent },
    });

    return toVerificationRecordDto(updated);
  }

  async reject(verificationId: string, actorId: string, notes?: string): Promise<VerificationRecordDto> {
    const record = await this.requireInReview(verificationId);

    const updated = await this.prisma.verificationRecord.update({
      where: { id: verificationId },
      data: { status: "REJECTED", reviewedById: actorId, notes },
      include: { submittedBy: true, reviewedBy: true },
    });

    await this.prisma.artwork.update({ where: { id: record.artworkId }, data: { status: "REJECTED" } });

    await this.provenance.record({
      artworkId: record.artworkId,
      type: "VERIFICATION_REJECTED",
      actorId,
      metadata: { notes: notes ?? null },
    });

    return toVerificationRecordDto(updated);
  }

  async historyForArtwork(artworkId: string): Promise<VerificationRecordDto[]> {
    const records = await this.prisma.verificationRecord.findMany({
      where: { artworkId },
      include: { submittedBy: true, reviewedBy: true },
      orderBy: { createdAt: "desc" },
    });
    return records.map(toVerificationRecordDto);
  }

  async listPending(): Promise<VerificationRecordDto[]> {
    const records = await this.prisma.verificationRecord.findMany({
      where: { status: "IN_REVIEW" },
      include: { submittedBy: true, reviewedBy: true },
      orderBy: { createdAt: "asc" },
    });
    return records.map(toVerificationRecordDto);
  }

  private async requireInReview(verificationId: string) {
    const record = await this.prisma.verificationRecord.findUnique({ where: { id: verificationId } });
    if (!record) throw AppError.notFound("Verification record not found");
    if (record.status !== "IN_REVIEW") {
      throw AppError.conflict("This verification has already been reviewed");
    }
    return record;
  }
}
