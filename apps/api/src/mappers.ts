import type {
  Artwork,
  ArtworkImage,
  DemoOperationLog,
  Listing,
  ProvenanceEvent,
  Transaction,
  User,
  Vault,
  VaultEvent,
  VerificationRecord,
} from "@prisma/client";
import type {
  ArtworkDetailDto,
  ArtworkSummaryDto,
  DemoOperationLogDto,
  ListingDto,
  ProvenanceEventDto,
  TransactionDto,
  UserDto,
  VaultEventDto,
  VaultSummaryDto,
  VerificationRecordDto,
} from "@spirit/shared";
import { computeGuaranteedFloor } from "./lib/vault-math.js";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

export function toVaultSummaryDto(artwork: Artwork, vault: Vault | null): VaultSummaryDto | null {
  if (!vault) return null;
  const artworkValue = Number(artwork.value);
  const coveragePercent = Number(vault.coveragePercent);
  return {
    artworkId: artwork.id,
    status: vault.status,
    artworkValue,
    coveragePercent,
    guaranteedFloor: computeGuaranteedFloor(artworkValue, coveragePercent),
    currency: artwork.currency,
    activatedAt: vault.activatedAt ? vault.activatedAt.toISOString() : null,
  };
}

export function toVaultEventDto(event: VaultEvent, performedBy: User | null): VaultEventDto {
  return {
    id: event.id,
    type: event.type,
    metadata: (event.metadata as Record<string, unknown>) ?? {},
    performedBy: performedBy ? toUserDto(performedBy) : null,
    createdAt: event.createdAt.toISOString(),
  };
}

export type ArtworkWithRelations = Artwork & {
  images: ArtworkImage[];
  currentOwner: User | null;
  vault: Vault | null;
};

export function toArtworkSummaryDto(artwork: ArtworkWithRelations): ArtworkSummaryDto {
  const cover = [...artwork.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return {
    id: artwork.id,
    spiritId: artwork.spiritId,
    chipId: artwork.chipId,
    title: artwork.title,
    artist: artwork.artist,
    status: artwork.status,
    value: Number(artwork.value),
    currency: artwork.currency,
    coverImageUrl: cover?.url ?? null,
    currentOwner: artwork.currentOwner ? toUserDto(artwork.currentOwner) : null,
    vault: toVaultSummaryDto(artwork, artwork.vault),
  };
}

export function toArtworkDetailDto(
  artwork: ArtworkWithRelations,
  activeListing: (Listing & { seller: User }) | null,
): ArtworkDetailDto {
  return {
    ...toArtworkSummaryDto(artwork),
    year: artwork.year,
    medium: artwork.medium,
    dimensions: artwork.dimensions,
    description: artwork.description,
    images: [...artwork.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({ id: image.id, url: image.url, sortOrder: image.sortOrder })),
    activeListing: activeListing ? toListingDto(activeListing) : null,
    createdAt: artwork.createdAt.toISOString(),
    updatedAt: artwork.updatedAt.toISOString(),
  };
}

export function toVerificationRecordDto(
  record: VerificationRecord & { submittedBy: User; reviewedBy: User | null },
): VerificationRecordDto {
  return {
    id: record.id,
    artworkId: record.artworkId,
    status: record.status,
    submittedBy: toUserDto(record.submittedBy),
    reviewedBy: record.reviewedBy ? toUserDto(record.reviewedBy) : null,
    notes: record.notes,
    resultPayload: (record.resultPayload as Record<string, unknown> | null) ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toProvenanceEventDto(
  event: ProvenanceEvent,
  usersById: Map<string, User>,
): ProvenanceEventDto {
  const resolve = (id: string | null) => (id ? usersById.get(id) ?? null : null);
  return {
    id: event.id,
    artworkId: event.artworkId,
    type: event.type,
    fromOwner: resolve(event.fromOwnerId) ? toUserDto(resolve(event.fromOwnerId) as User) : null,
    toOwner: resolve(event.toOwnerId) ? toUserDto(resolve(event.toOwnerId) as User) : null,
    actor: resolve(event.actorId) ? toUserDto(resolve(event.actorId) as User) : null,
    metadata: (event.metadata as Record<string, unknown>) ?? {},
    createdAt: event.createdAt.toISOString(),
  };
}

export function toListingDto(listing: Listing & { seller: User }): ListingDto {
  return {
    id: listing.id,
    artworkId: listing.artworkId,
    seller: toUserDto(listing.seller),
    price: Number(listing.price),
    currency: listing.currency,
    status: listing.status,
    createdAt: listing.createdAt.toISOString(),
  };
}

export function toTransactionDto(tx: Transaction & { buyer: User; seller: User }): TransactionDto {
  return {
    id: tx.id,
    listingId: tx.listingId,
    artworkId: tx.artworkId,
    buyer: toUserDto(tx.buyer),
    seller: toUserDto(tx.seller),
    amount: Number(tx.amount),
    currency: tx.currency,
    status: tx.status,
    paymentRef: tx.paymentRef,
    blockchainRef: tx.blockchainRef,
    createdAt: tx.createdAt.toISOString(),
    completedAt: tx.completedAt ? tx.completedAt.toISOString() : null,
  };
}

export function toDemoOperationLogDto(log: DemoOperationLog & { performedBy: User | null }): DemoOperationLogDto {
  return {
    id: log.id,
    operation: log.operation,
    datasetName: log.datasetName,
    performedBy: log.performedBy ? toUserDto(log.performedBy) : null,
    createdAt: log.createdAt.toISOString(),
  };
}

export const artworkInclude = {
  images: true,
  currentOwner: true,
  vault: true,
} as const;
