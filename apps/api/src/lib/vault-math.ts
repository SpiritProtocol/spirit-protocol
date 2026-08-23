/** guaranteedFloor = artworkValue x coveragePercent. Always derived, never persisted, so it can't drift when either input changes. */
export function computeGuaranteedFloor(artworkValue: number, coveragePercent: number): number {
  return Math.round(artworkValue * (coveragePercent / 100) * 100) / 100;
}
