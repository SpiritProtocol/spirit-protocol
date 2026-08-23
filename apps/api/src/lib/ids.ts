let spiritSequence = Math.floor(Math.random() * 900) + 100;

/** Genesis Artifact-style protocol id, e.g. "SPR-000123". Sequential-looking but random-seeded per process so demo resets don't collide. */
export function generateSpiritId(): string {
  spiritSequence += 1;
  return `SPR-${String(spiritSequence).padStart(6, "0")}`;
}

function hex(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase();
  }
  return out;
}

/** Simulated NFC chip identifier resembling an NTAG 424 DNA UID, e.g. "NTAG424_0x8F21...90A". */
export function generateChipId(): string {
  return `NTAG424_0x${hex(4)}...${hex(3)}`;
}

/** Simulated blockchain transaction hash. */
export function generateMockTxHash(): string {
  return `0x${hex(64).toLowerCase()}`;
}
