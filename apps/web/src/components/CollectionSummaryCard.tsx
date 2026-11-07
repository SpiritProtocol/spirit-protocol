import type { ArtworkSummaryDto } from "@spirit/shared";
import { currencyFormat } from "../lib/format";

export function CollectionSummaryCard({ artworks }: { artworks: ArtworkSummaryDto[] }) {
  const totalValue = artworks.reduce((sum, artwork) => sum + artwork.value, 0);

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
    </div>
  );
}
