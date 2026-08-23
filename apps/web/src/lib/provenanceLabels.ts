import type { ProvenanceEventType } from "@spirit/shared";

export const PROVENANCE_EVENT_LABELS: Record<ProvenanceEventType, string> = {
  CREATED: "Artwork registered",
  STATUS_CHANGED: "Status changed",
  VERIFICATION_STARTED: "Verification started",
  VERIFIED: "Verified",
  VERIFICATION_REJECTED: "Verification rejected",
  VAULT_ACTIVATED: "Vault activated",
  VAULT_COVERAGE_UPDATED: "Vault coverage updated",
  LISTED: "Listed for sale",
  LISTING_CANCELLED: "Listing cancelled",
  OWNERSHIP_TRANSFERRED: "Ownership transferred",
  SOLD: "Sold",
  DEMO_RESET: "Demo data reset",
};
