import { Shield } from "lucide-react";
import type { ArtworkSummaryDto } from "@spirit/shared";
import { currencyFormat } from "../lib/format";

export function VaultSummaryCard({ artworks }: { artworks: ArtworkSummaryDto[] }) {
  const totalValue = artworks.reduce((sum, artwork) => sum + artwork.value, 0);
  const totalFloor = artworks.reduce((sum, artwork) => sum + (artwork.vault?.guaranteedFloor ?? 0), 0);
  const coveragePercent = totalValue > 0 ? Math.round((totalFloor / totalValue) * 100) : 0;

  return (
    <div className="mx-5 mt-2 mb-6 overflow-hidden rounded-2xl border border-neutral-200">
      <div className="p-5">
        <div className="mb-1 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">
          Total Collection Value
        </div>
        <div className="font-mono text-3xl font-semibold tracking-tight">
          {currencyFormat.format(totalValue)}
        </div>
      </div>
      <div className="h-px bg-neutral-200" />
      <div className="flex items-center justify-between p-5">
        <div>
          <div className="mb-1 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">
            Vault Floor Guaranteed
          </div>
          <div className="font-mono text-lg font-medium">{currencyFormat.format(totalFloor)}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5">
          <Shield size={13} strokeWidth={2} />
          <span className="font-mono text-xs font-semibold">{coveragePercent}%</span>
        </div>
      </div>
    </div>
  );
}
