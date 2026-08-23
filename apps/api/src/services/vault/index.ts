import type { PrismaClient } from "@prisma/client";
import { env } from "../../env.js";
import { MockVaultService } from "./mock.js";
import type { VaultService } from "./types.js";

export type { VaultService, VaultState } from "./types.js";

export function createVaultService(prisma: PrismaClient): VaultService {
  if (env.VAULT_MODE === "real") {
    throw new Error("Real (TON smart-contract-based) vault is not implemented in the MVP.");
  }
  return new MockVaultService(prisma);
}
