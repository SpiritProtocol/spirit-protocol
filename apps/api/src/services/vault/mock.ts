import type { PrismaClient, Vault } from "@prisma/client";
import { DEFAULT_VAULT_COVERAGE_PERCENT } from "@spirit/shared";
import type { VaultService, VaultState } from "./types.js";

function toState(vault: Vault): VaultState {
  return {
    artworkId: vault.artworkId,
    status: vault.status,
    coveragePercent: Number(vault.coveragePercent),
    activatedAt: vault.activatedAt ? vault.activatedAt.toISOString() : null,
  };
}

export class MockVaultService implements VaultService {
  constructor(private readonly prisma: PrismaClient) {}

  async initializeVault({ artworkId }: { artworkId: string }): Promise<VaultState> {
    const existing = await this.prisma.vault.findUnique({ where: { artworkId } });
    if (existing && existing.status === "ACTIVE") {
      return toState(existing);
    }

    const vault = await this.prisma.vault.upsert({
      where: { artworkId },
      create: {
        artworkId,
        coveragePercent: DEFAULT_VAULT_COVERAGE_PERCENT,
        status: "ACTIVE",
        activatedAt: new Date(),
      },
      update: {
        status: "ACTIVE",
        activatedAt: new Date(),
      },
    });

    await this.prisma.vaultEvent.create({
      data: {
        vaultId: vault.id,
        type: "ACTIVATED",
        metadata: { coveragePercent: Number(vault.coveragePercent) },
      },
    });

    return toState(vault);
  }

  async getVaultState(artworkId: string): Promise<VaultState | null> {
    const vault = await this.prisma.vault.findUnique({ where: { artworkId } });
    return vault ? toState(vault) : null;
  }

  async updateCoverage(input: {
    artworkId: string;
    coveragePercent: number;
    actorId: string | null;
  }): Promise<VaultState> {
    const previous = await this.prisma.vault.findUnique({ where: { artworkId: input.artworkId } });

    const vault = await this.prisma.vault.upsert({
      where: { artworkId: input.artworkId },
      create: {
        artworkId: input.artworkId,
        coveragePercent: input.coveragePercent,
        status: "NOT_INITIALIZED",
      },
      update: {
        coveragePercent: input.coveragePercent,
      },
    });

    await this.prisma.vaultEvent.create({
      data: {
        vaultId: vault.id,
        type: "COVERAGE_UPDATED",
        performedById: input.actorId,
        metadata: {
          previousCoveragePercent: previous ? Number(previous.coveragePercent) : null,
          coveragePercent: input.coveragePercent,
        },
      },
    });

    return toState(vault);
  }

  async recordValueChanged(input: { artworkId: string; actorId: string | null }): Promise<void> {
    const vault = await this.prisma.vault.findUnique({ where: { artworkId: input.artworkId } });
    if (!vault) return;

    await this.prisma.vaultEvent.create({
      data: {
        vaultId: vault.id,
        type: "VALUE_UPDATED",
        performedById: input.actorId,
        metadata: {},
      },
    });
  }
}
