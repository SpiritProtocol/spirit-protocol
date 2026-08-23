import { generateMockTxHash } from "../../lib/ids.js";
import type { BlockchainRecord, BlockchainService } from "./types.js";

/**
 * Simulates an immutable ledger by minting a fake tx hash / block number.
 * Callers persist the returned record into ProvenanceEvent.metadata so the
 * provenance timeline reads the same whether the ledger is real or mocked.
 */
export class MockBlockchainService implements BlockchainService {
  private blockNumber = 18_500_000 + Math.floor(Math.random() * 10_000);

  async registerArtwork(_input: { artworkId: string; spiritId: string }): Promise<BlockchainRecord> {
    return this.mine();
  }

  async recordOwnershipTransfer(_input: {
    artworkId: string;
    fromOwnerId: string | null;
    toOwnerId: string;
  }): Promise<BlockchainRecord> {
    return this.mine();
  }

  private async mine(): Promise<BlockchainRecord> {
    await delay(200 + Math.random() * 300);
    this.blockNumber += 1;
    return {
      txHash: generateMockTxHash(),
      blockNumber: this.blockNumber,
      recordedAt: new Date().toISOString(),
    };
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
