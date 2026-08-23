import type { PrismaClient } from "@prisma/client";
import type { ArtworkDetailDto, ArtworkStatus, ArtworkSummaryDto, CreateArtworkInput, UpdateArtworkInput } from "@spirit/shared";
import { AppError } from "../../lib/errors.js";
import { generateSpiritId } from "../../lib/ids.js";
import { artworkInclude, toArtworkDetailDto, toArtworkSummaryDto, type ArtworkWithRelations } from "../../mappers.js";
import type { BlockchainService } from "../../services/blockchain/index.js";
import type { ProvenanceService } from "../provenance/provenance.service.js";
import type { VaultService } from "../../services/vault/index.js";

export interface ArtworkListFilters {
  status?: ArtworkStatus;
  ownerId?: string;
}

export class ArtworksService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provenance: ProvenanceService,
    private readonly blockchain: BlockchainService,
    private readonly vault: VaultService,
  ) {}

  async create(input: CreateArtworkInput, actorId: string): Promise<ArtworkDetailDto> {
    const spiritId = generateSpiritId();

    const artwork = await this.prisma.artwork.create({
      data: {
        spiritId,
        title: input.title,
        artist: input.artist,
        year: input.year,
        medium: input.medium,
        dimensions: input.dimensions,
        description: input.description,
        value: input.value,
        status: "DRAFT",
        currentOwnerId: input.ownerId ?? null,
        createdById: actorId,
        images: { create: input.images.map((url, sortOrder) => ({ url, sortOrder })) },
      },
      include: artworkInclude,
    });

    const chainRecord = await this.blockchain.registerArtwork({ artworkId: artwork.id, spiritId });

    await this.provenance.record({
      artworkId: artwork.id,
      type: "CREATED",
      toOwnerId: artwork.currentOwnerId,
      actorId,
      metadata: { blockchainRef: chainRecord.txHash, blockNumber: chainRecord.blockNumber },
    });

    return this.getById(artwork.id);
  }

  async update(id: string, input: UpdateArtworkInput, actorId: string): Promise<ArtworkDetailDto> {
    const existing = await this.requireArtwork(id);
    const valueChanged = input.value !== undefined && Number(existing.value) !== input.value;

    const artwork = await this.prisma.artwork.update({
      where: { id },
      data: {
        title: input.title,
        artist: input.artist,
        year: input.year,
        medium: input.medium,
        dimensions: input.dimensions,
        description: input.description,
        value: input.value,
        ...(input.images
          ? { images: { deleteMany: {}, create: input.images.map((url, sortOrder) => ({ url, sortOrder })) } }
          : {}),
      },
      include: artworkInclude,
    });

    if (valueChanged) {
      await this.vault.recordValueChanged({ artworkId: id, actorId });
    }

    return this.toDetail(artwork);
  }

  async list(filters: ArtworkListFilters): Promise<ArtworkSummaryDto[]> {
    const artworks = await this.prisma.artwork.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.ownerId ? { currentOwnerId: filters.ownerId } : {}),
      },
      include: artworkInclude,
      orderBy: { createdAt: "desc" },
    });
    return artworks.map(toArtworkSummaryDto);
  }

  async getById(id: string): Promise<ArtworkDetailDto> {
    const artwork = await this.requireArtwork(id);
    return this.toDetail(artwork);
  }

  async changeStatus(id: string, status: ArtworkStatus, actorId: string): Promise<ArtworkDetailDto> {
    const existing = await this.requireArtwork(id);
    if (existing.status === status) return this.toDetail(existing);

    const artwork = await this.prisma.artwork.update({
      where: { id },
      data: { status },
      include: artworkInclude,
    });

    await this.provenance.record({
      artworkId: id,
      type: "STATUS_CHANGED",
      actorId,
      metadata: { from: existing.status, to: status },
    });

    return this.toDetail(artwork);
  }

  async assignOwner(id: string, ownerId: string, actorId: string): Promise<ArtworkDetailDto> {
    const existing = await this.requireArtwork(id);
    const fromOwnerId = existing.currentOwnerId;

    const artwork = await this.prisma.artwork.update({
      where: { id },
      data: { currentOwnerId: ownerId },
      include: artworkInclude,
    });

    const chainRecord = await this.blockchain.recordOwnershipTransfer({
      artworkId: id,
      fromOwnerId,
      toOwnerId: ownerId,
    });

    await this.provenance.record({
      artworkId: id,
      type: "OWNERSHIP_TRANSFERRED",
      fromOwnerId,
      toOwnerId: ownerId,
      actorId,
      metadata: { blockchainRef: chainRecord.txHash, blockNumber: chainRecord.blockNumber, reason: "admin_assignment" },
    });

    return this.toDetail(artwork);
  }

  private async toDetail(artwork: ArtworkWithRelations): Promise<ArtworkDetailDto> {
    const activeListing = await this.prisma.listing.findFirst({
      where: { artworkId: artwork.id, status: "ACTIVE" },
      include: { seller: true },
    });
    return toArtworkDetailDto(artwork, activeListing);
  }

  private async requireArtwork(id: string) {
    const artwork = await this.prisma.artwork.findUnique({ where: { id }, include: artworkInclude });
    if (!artwork) throw AppError.notFound("Artwork not found");
    return artwork;
  }
}
