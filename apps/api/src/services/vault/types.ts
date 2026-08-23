import type { VaultStatus } from "@spirit/shared";

export interface VaultState {
  artworkId: string;
  status: VaultStatus;
  coveragePercent: number;
  activatedAt: string | null;
}

/**
 * Manages an artwork's vault lifecycle and coverage configuration. This is
 * the abstraction boundary a future real TON smart-contract-based vault
 * implementation would sit behind — the mock persists lifecycle state in
 * Postgres, a real one would read/write on-chain instead, with the same
 * method signatures.
 */
export interface VaultService {
  /** Activates the artwork's vault (idempotent), applying the default coverage on first activation. */
  initializeVault(input: { artworkId: string }): Promise<VaultState>;
  getVaultState(artworkId: string): Promise<VaultState | null>;
  /** Admin-only: overrides the coverage percentage for demo purposes. */
  updateCoverage(input: { artworkId: string; coveragePercent: number; actorId: string | null }): Promise<VaultState>;
  /** Logs that the underlying artwork value changed, so the vault activity log reflects it (floor is still derived, not stored). */
  recordValueChanged(input: { artworkId: string; actorId: string | null }): Promise<void>;
}
