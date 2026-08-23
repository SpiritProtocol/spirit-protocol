import { Shield } from "lucide-react";
import type { VaultSummaryDto } from "@spirit/shared";
import { currencyFormat } from "../lib/format";

export function VaultBadge({ vault }: { vault: VaultSummaryDto }) {
  if (vault.status !== "ACTIVE") return null;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500">
      <Shield size={12} strokeWidth={2} />
      <span>
        Vault {vault.coveragePercent}% · floor {currencyFormat.format(vault.guaranteedFloor)}
      </span>
    </div>
  );
}
