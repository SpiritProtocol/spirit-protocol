import type {
  ArtworkStatus,
  DemoOperation,
  ListingStatus,
  ProvenanceEventType,
  TransactionStatus,
  UserRole,
  VaultEventType,
  VaultStatus,
  VerificationStatus,
} from "./enums.js";

export interface UserDto {
  id: string;
  telegramId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
}

/** Always derived (artworkValue x coveragePercent), never trusted from a client. */
export interface VaultSummaryDto {
  artworkId: string;
  status: VaultStatus;
  artworkValue: number;
  coveragePercent: number;
  guaranteedFloor: number;
  currency: string;
  activatedAt: string | null;
}

export interface VaultDetailDto {
  summary: VaultSummaryDto;
  events: VaultEventDto[];
}

export interface VaultEventDto {
  id: string;
  type: VaultEventType;
  metadata: Record<string, unknown>;
  performedBy: UserDto | null;
  createdAt: string;
}

export interface ArtworkImageDto {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ArtworkSummaryDto {
  id: string;
  spiritId: string;
  chipId: string | null;
  title: string;
  artist: string;
  status: ArtworkStatus;
  value: number;
  currency: string;
  coverImageUrl: string | null;
  currentOwner: UserDto | null;
  vault: VaultSummaryDto | null;
}

export interface ArtworkDetailDto extends ArtworkSummaryDto {
  year: number | null;
  medium: string | null;
  dimensions: string | null;
  description: string | null;
  images: ArtworkImageDto[];
  activeListing: ListingDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRecordDto {
  id: string;
  artworkId: string;
  status: VerificationStatus;
  submittedBy: UserDto | null;
  reviewedBy: UserDto | null;
  notes: string | null;
  resultPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProvenanceEventDto {
  id: string;
  artworkId: string;
  type: ProvenanceEventType;
  fromOwner: UserDto | null;
  toOwner: UserDto | null;
  actor: UserDto | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ListingDto {
  id: string;
  artworkId: string;
  seller: UserDto;
  price: number;
  currency: string;
  status: ListingStatus;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  listingId: string;
  artworkId: string;
  buyer: UserDto;
  seller: UserDto;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentRef: string | null;
  blockchainRef: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CollectionDto {
  artworks: ArtworkSummaryDto[];
  transactions: TransactionDto[];
}

export interface DemoOperationLogDto {
  id: string;
  operation: DemoOperation;
  datasetName: string | null;
  performedBy: UserDto | null;
  createdAt: string;
}
