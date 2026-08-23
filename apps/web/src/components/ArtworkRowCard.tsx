import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { ArtworkSummaryDto } from "@spirit/shared";
import { FallbackImage } from "./FallbackImage";
import { ARTWORK_STATUS_LABELS } from "./StatusBadge";
import { currencyFormat } from "../lib/format";

const VERIFIED_STATUSES = new Set(["VERIFIED", "LISTED", "SOLD"]);

export function ArtworkRowCard({ artwork }: { artwork: ArtworkSummaryDto }) {
  const isVerified = VERIFIED_STATUSES.has(artwork.status);

  return (
    <Link
      to={`/artworks/${artwork.id}`}
      className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-left transition-colors active:bg-neutral-50"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
        <FallbackImage src={artwork.coverImageUrl} alt={artwork.title} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold">{artwork.title}</h3>
        <div className="mb-1.5 flex items-center gap-1 text-[11px] text-neutral-400">
          {isVerified ? <CheckCircle2 size={11} strokeWidth={2} /> : <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />}
          <span>{isVerified ? "NTAG 424 verified" : ARTWORK_STATUS_LABELS[artwork.status]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] font-medium">{currencyFormat.format(artwork.value)}</span>
          {artwork.vault && artwork.vault.status === "ACTIVE" && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-[12px] text-neutral-400">
                Floor {currencyFormat.format(artwork.vault.guaranteedFloor)}
              </span>
            </>
          )}
        </div>
      </div>
      <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-neutral-300" />
    </Link>
  );
}
