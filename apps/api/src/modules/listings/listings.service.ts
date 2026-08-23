import type { PrismaClient } from "@prisma/client";
import type { CreateListingInput, ListingDto, UpdateListingInput, UserRole } from "@spirit/shared";
import { AppError } from "../../lib/errors.js";
import { toListingDto } from "../../mappers.js";
import type { ProvenanceService } from "../provenance/provenance.service.js";

export class ListingsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provenance: ProvenanceService,
  ) {}

  async create(input: CreateListingInput, actor: { id: string; role: UserRole }): Promise<ListingDto> {
    const artwork = await this.prisma.artwork.findUnique({ where: { id: input.artworkId } });
    if (!artwork) throw AppError.notFound("Artwork not found");
    if (artwork.currentOwnerId !== actor.id && actor.role !== "ADMIN") {
      throw AppError.forbidden("Only the current owner or an admin can list this artwork");
    }
    if (artwork.status !== "VERIFIED") {
      throw AppError.conflict("Only verified artworks can be listed");
    }
    if (!artwork.currentOwnerId) {
      throw AppError.conflict("This artwork has no owner to sell on its behalf");
    }

    const listing = await this.prisma.listing.create({
      data: {
        artworkId: artwork.id,
        sellerId: artwork.currentOwnerId,
        price: input.price,
        currency: input.currency,
        status: "ACTIVE",
      },
      include: { seller: true },
    });

    await this.prisma.artwork.update({ where: { id: artwork.id }, data: { status: "LISTED" } });

    await this.provenance.record({
      artworkId: artwork.id,
      type: "LISTED",
      actorId: actor.id,
      listingId: listing.id,
      metadata: { price: input.price, currency: input.currency },
    });

    return toListingDto(listing);
  }

  async update(id: string, input: UpdateListingInput, actor: { id: string; role: UserRole }): Promise<ListingDto> {
    const existing = await this.prisma.listing.findUnique({ where: { id }, include: { artwork: true } });
    if (!existing) throw AppError.notFound("Listing not found");
    if (existing.sellerId !== actor.id && actor.role !== "ADMIN") {
      throw AppError.forbidden("Only the seller or an admin can edit this listing");
    }
    if (existing.status !== "ACTIVE") {
      throw AppError.conflict("This listing is no longer active");
    }

    const listing = await this.prisma.listing.update({
      where: { id },
      data: { price: input.price, status: input.status },
      include: { seller: true },
    });

    if (input.status === "CANCELLED") {
      await this.prisma.artwork.update({ where: { id: existing.artworkId }, data: { status: "VERIFIED" } });
      await this.provenance.record({
        artworkId: existing.artworkId,
        type: "LISTING_CANCELLED",
        actorId: actor.id,
        listingId: id,
        metadata: {},
      });
    }

    return toListingDto(listing);
  }

  async list(status: "ACTIVE" | "SOLD" | "CANCELLED" = "ACTIVE"): Promise<ListingDto[]> {
    const listings = await this.prisma.listing.findMany({
      where: { status },
      include: { seller: true },
      orderBy: { createdAt: "desc" },
    });
    return listings.map(toListingDto);
  }

  async getById(id: string): Promise<ListingDto> {
    const listing = await this.prisma.listing.findUnique({ where: { id }, include: { seller: true } });
    if (!listing) throw AppError.notFound("Listing not found");
    return toListingDto(listing);
  }
}
