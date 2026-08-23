import { env } from "../../env.js";
import { MockBlockchainService } from "./mock.js";
import type { BlockchainService } from "./types.js";

export type { BlockchainRecord, BlockchainService } from "./types.js";

let singleton: BlockchainService | undefined;

export function createBlockchainService(): BlockchainService {
  if (env.BLOCKCHAIN_MODE === "real") {
    throw new Error("Real blockchain integration is not implemented in the MVP.");
  }
  // Singleton so the mock block number keeps incrementing realistically across requests.
  singleton ??= new MockBlockchainService();
  return singleton;
}
