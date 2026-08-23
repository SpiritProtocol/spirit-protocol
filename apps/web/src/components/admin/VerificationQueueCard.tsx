import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ArtworkDetailDto, VerificationRecordDto } from "@spirit/shared";
import { apiClient, ApiError } from "../../lib/apiClient";
import { FallbackImage } from "../FallbackImage";
import { dateFormat } from "../../lib/format";

interface ScanPayload {
  chipId?: string;
  tamperDetected?: boolean;
  signatureValid?: boolean;
  scannedAt?: string;
}

export function VerificationQueueCard({
  record,
  artwork,
}: {
  record: VerificationRecordDto;
  artwork: ArtworkDetailDto | undefined;
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const scan = (record.resultPayload ?? {}) as ScanPayload;

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["verifications"] });
    void queryClient.invalidateQueries({ queryKey: ["artworks"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/verifications/${record.id}/approve`, { notes: notes || undefined }),
    onSuccess: invalidateAll,
  });
  const rejectMutation = useMutation({
    mutationFn: () => apiClient.post(`/verifications/${record.id}/reject`, { notes: notes || undefined }),
    onSuccess: invalidateAll,
  });

  const error = approveMutation.error ?? rejectMutation.error;
  const busy = approveMutation.isPending || rejectMutation.isPending;

  return (
    <li className="flex gap-4 rounded-xl border border-neutral-200 p-4">
      <FallbackImage
        src={artwork?.coverImageUrl ?? null}
        alt={artwork?.title ?? "Artwork"}
        className="h-24 w-24 shrink-0 rounded-lg object-cover"
      />
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold">{artwork?.title ?? "Loading…"}</h3>
          <span className="text-xs text-neutral-400">{dateFormat.format(new Date(record.createdAt))}</span>
        </div>
        <p className="text-sm text-neutral-400">{artwork?.artist}</p>
        <p className="text-xs text-neutral-400">Spirit ID {artwork?.spiritId}</p>
        <p className="mt-1 text-xs text-neutral-400">Submitted by {record.submittedBy?.displayName ?? "—"}</p>

        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          <div>
            <dt className="inline text-neutral-400">Chip: </dt>
            <dd className="inline font-mono">{scan.chipId ?? "—"}</dd>
          </div>
          <div>
            <dt className="inline text-neutral-400">Signature: </dt>
            <dd className="inline">{scan.signatureValid ? "valid" : "invalid"}</dd>
          </div>
          {scan.tamperDetected && <span className="font-medium text-red-600">⚠ Tamper detected</span>}
        </dl>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Review notes (optional)"
          rows={2}
          className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => approveMutation.mutate()}
            disabled={busy}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => rejectMutation.mutate()}
            disabled={busy}
            className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Reject
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-500">{error instanceof ApiError ? error.message : "Something went wrong"}</p>
        )}
      </div>
    </li>
  );
}
