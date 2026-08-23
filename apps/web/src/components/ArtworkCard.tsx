import { Link } from "react-router-dom";
import type { ArtworkSummaryDto } from "@spirit/shared";
import { FallbackImage } from "./FallbackImage";
import { StatusBadge } from "./StatusBadge";
import { VaultBadge } from "./VaultBadge";
import { currencyFormat } from "../lib/format";

export function ArtworkCard({ artwork }: { artwork: ArtworkSummaryDto }) {
  return (
    <Link
      to={`/artworks/${artwork.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 transition active:bg-neutral-50"
    >
      <FallbackImage src={artwork.coverImageUrl} alt={artwork.title} className="aspect-square w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{artwork.title}</h3>
            <p className="text-sm text-neutral-400">{artwork.artist}</p>
          </div>
          <StatusBadge status={artwork.status} />
        </div>
        <p className="text-xs text-neutral-400">Spirit ID {artwork.spiritId}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold">{currencyFormat.format(artwork.value)}</span>
        </div>
        {artwork.vault && <VaultBadge vault={artwork.vault} />}
      </div>
    </Link>
  );
}
