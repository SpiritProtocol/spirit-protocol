import { useQueries, useQuery } from "@tanstack/react-query";
import type { ArtworkDetailDto, VerificationRecordDto } from "@spirit/shared";
import { apiClient } from "../../lib/apiClient";
import { AdminShell } from "../../components/admin/AdminShell";
import { VerificationQueueCard } from "../../components/admin/VerificationQueueCard";

export function VerificationQueuePage() {
  const pendingQuery = useQuery({
    queryKey: ["verifications", "pending"],
    queryFn: () => apiClient.get<VerificationRecordDto[]>("/verifications/pending"),
  });

  const records = pendingQuery.data ?? [];
  const artworkQueries = useQueries({
    queries: records.map((record) => ({
      queryKey: ["artworks", record.artworkId],
      queryFn: () => apiClient.get<ArtworkDetailDto>(`/artworks/${record.artworkId}`),
    })),
  });

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Verification Queue {records.length > 0 && `(${records.length})`}
      </h2>

      {pendingQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {pendingQuery.isError && <p className="text-sm text-red-400">{pendingQuery.error.message}</p>}

      {!pendingQuery.isLoading && records.length === 0 && (
        <p className="text-sm text-neutral-500">Nothing pending review.</p>
      )}

      <ul className="flex flex-col gap-3">
        {records.map((record, index) => (
          <VerificationQueueCard key={record.id} record={record} artwork={artworkQueries[index]?.data} />
        ))}
      </ul>
    </AdminShell>
  );
}
