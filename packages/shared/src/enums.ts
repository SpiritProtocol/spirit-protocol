export const UserRole = {
  COLLECTOR: "COLLECTOR",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ArtworkStatus = {
  DRAFT: "DRAFT",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  LISTED: "LISTED",
  SOLD: "SOLD",
  ARCHIVED: "ARCHIVED",
} as const;
export type ArtworkStatus = (typeof ArtworkStatus)[keyof typeof ArtworkStatus];

export const VerificationStatus = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const ProvenanceEventType = {
  CREATED: "CREATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  VERIFICATION_STARTED: "VERIFICATION_STARTED",
  VERIFIED: "VERIFIED",
  VERIFICATION_REJECTED: "VERIFICATION_REJECTED",
  VAULT_ACTIVATED: "VAULT_ACTIVATED",
  VAULT_COVERAGE_UPDATED: "VAULT_COVERAGE_UPDATED",
  LISTED: "LISTED",
  LISTING_CANCELLED: "LISTING_CANCELLED",
  OWNERSHIP_TRANSFERRED: "OWNERSHIP_TRANSFERRED",
  SOLD: "SOLD",
  DEMO_RESET: "DEMO_RESET",
} as const;
export type ProvenanceEventType = (typeof ProvenanceEventType)[keyof typeof ProvenanceEventType];

export const ListingStatus = {
  ACTIVE: "ACTIVE",
  SOLD: "SOLD",
  CANCELLED: "CANCELLED",
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const TransactionStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const VaultStatus = {
  NOT_INITIALIZED: "NOT_INITIALIZED",
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
} as const;
export type VaultStatus = (typeof VaultStatus)[keyof typeof VaultStatus];

export const VaultEventType = {
  ACTIVATED: "ACTIVATED",
  COVERAGE_UPDATED: "COVERAGE_UPDATED",
  VALUE_UPDATED: "VALUE_UPDATED",
} as const;
export type VaultEventType = (typeof VaultEventType)[keyof typeof VaultEventType];

export const DemoOperation = {
  SEED: "SEED",
  RESET: "RESET",
  CLEAR: "CLEAR",
} as const;
export type DemoOperation = (typeof DemoOperation)[keyof typeof DemoOperation];

/** Default vault coverage percentage applied when a vault is first activated. */
export const DEFAULT_VAULT_COVERAGE_PERCENT = 80;
