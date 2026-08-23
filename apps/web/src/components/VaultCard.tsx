import type { VaultSummaryDto } from "@spirit/shared";
import { currencyFormat } from "../lib/format";

const STATUS_LABELS: Record<VaultSummaryDto["status"], string> = {
  NOT_INITIALIZED: "Not initialized",
  ACTIVE: "Locked in Vault",
  LOCKED: "Locked",
};

export function VaultCard({ vault }: { vault: VaultSummaryDto }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="mb-1.5 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">
        Guaranteed Vault Floor
      </div>
      {vault.status === "ACTIVE" ? (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[22px] font-semibold">
              {currencyFormat.format(vault.guaranteedFloor)}
            </span>
            <span className="text-[13px] text-neutral-400">({vault.coveragePercent}% covered)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            {STATUS_LABELS[vault.status]}
          </div>
        </>
      ) : (
        <div className="text-[13px] text-neutral-400">{STATUS_LABELS[vault.status]}</div>
      )}
    </div>
  );
}
