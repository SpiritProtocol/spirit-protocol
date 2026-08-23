import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ArtworkStatus, ArtworkSummaryDto, UserDto } from "@spirit/shared";
import { apiClient, ApiError } from "../../lib/apiClient";
import { FallbackImage } from "../FallbackImage";
import { StatusBadge, ARTWORK_STATUS_LABELS } from "../StatusBadge";
import { currencyFormat } from "../../lib/format";

const ALL_STATUSES = Object.keys(ARTWORK_STATUS_LABELS) as ArtworkStatus[];

export function ArtworkAdminRow({ artwork, users }: { artwork: ArtworkSummaryDto; users: UserDto[] }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ArtworkStatus>(artwork.status);
  const [ownerId, setOwnerId] = useState(artwork.currentOwner?.id ?? "");
  const [coverage, setCoverage] = useState(artwork.vault?.coveragePercent ?? 80);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["artworks"] });

  const statusMutation = useMutation({
    mutationFn: () => apiClient.patch(`/artworks/${artwork.id}/status`, { status }),
    onSuccess: invalidate,
  });
  const ownerMutation = useMutation({
    mutationFn: () => apiClient.patch(`/artworks/${artwork.id}/owner`, { ownerId }),
    onSuccess: invalidate,
  });
  const coverageMutation = useMutation({
    mutationFn: () => apiClient.patch(`/admin/vaults/${artwork.id}/coverage`, { coveragePercent: coverage }),
    onSuccess: invalidate,
  });

  const error = statusMutation.error ?? ownerMutation.error ?? coverageMutation.error;

  return (
    <li className="flex gap-4 rounded-xl border border-neutral-200 p-4">
      <FallbackImage src={artwork.coverImageUrl} alt={artwork.title} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link to={`/artworks/${artwork.id}`} className="font-semibold hover:underline">
            {artwork.title}
          </Link>
          <StatusBadge status={artwork.status} />
        </div>
        <p className="text-sm text-neutral-400">{artwork.artist}</p>
        <p className="text-xs text-neutral-400">
          {artwork.spiritId} · {currencyFormat.format(artwork.value)} · owner {artwork.currentOwner?.displayName ?? "—"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArtworkStatus)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ARTWORK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => statusMutation.mutate()}
            disabled={statusMutation.isPending || status === artwork.status}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Set status
          </button>

          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none"
          >
            <option value="">No owner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => ownerMutation.mutate()}
            disabled={ownerMutation.isPending || !ownerId || ownerId === artwork.currentOwner?.id}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
          >
            Assign owner
          </button>

          {artwork.vault && (
            <>
              <input
                type="number"
                min={0}
                max={100}
                value={coverage}
                onChange={(e) => setCoverage(Number(e.target.value))}
                className="w-16 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => coverageMutation.mutate()}
                disabled={coverageMutation.isPending || coverage === artwork.vault.coveragePercent}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
              >
                Set vault %
              </button>
            </>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-500">{error instanceof ApiError ? error.message : "Something went wrong"}</p>
        )}
      </div>
    </li>
  );
}
