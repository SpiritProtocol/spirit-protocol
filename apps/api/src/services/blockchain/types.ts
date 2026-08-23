export interface BlockchainRecord {
  txHash: string;
  blockNumber: number;
  recordedAt: string;
}

export interface BlockchainService {
  /** Simulates (or, in a future real implementation, performs) registering a new artwork's digital twin on-chain. */
  registerArtwork(input: { artworkId: string; spiritId: string }): Promise<BlockchainRecord>;
  /** Simulates (or, in a future real implementation, performs) recording an ownership transfer on-chain. */
  recordOwnershipTransfer(input: {
    artworkId: string;
    fromOwnerId: string | null;
    toOwnerId: string;
  }): Promise<BlockchainRecord>;
}
