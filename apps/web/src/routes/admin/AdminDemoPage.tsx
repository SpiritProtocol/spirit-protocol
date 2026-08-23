import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DemoOperationLogDto } from "@spirit/shared";
import { apiClient, ApiError } from "../../lib/apiClient";
import { AdminShell } from "../../components/admin/AdminShell";
import { dateFormat } from "../../lib/format";

export function AdminDemoPage() {
  const queryClient = useQueryClient();
  const logsQuery = useQuery({
    queryKey: ["admin", "demo", "logs"],
    queryFn: () => apiClient.get<DemoOperationLogDto[]>("/admin/demo/logs"),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "demo", "logs"] });
    void queryClient.invalidateQueries({ queryKey: ["artworks"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
  };

  const seedMutation = useMutation({
    mutationFn: () => apiClient.post("/admin/demo/seed", { dataset: "investor-demo" }),
    onSuccess: invalidateAll,
  });
  const resetMutation = useMutation({
    mutationFn: () => apiClient.post("/admin/demo/reset", { dataset: "investor-demo" }),
    onSuccess: invalidateAll,
  });
  const clearMutation = useMutation({
    mutationFn: () => apiClient.post("/admin/demo/clear"),
    onSuccess: invalidateAll,
  });

  const error = seedMutation.error ?? resetMutation.error ?? clearMutation.error;
  const busy = seedMutation.isPending || resetMutation.isPending || clearMutation.isPending;

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Demo Data</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => seedMutation.mutate()}
          disabled={busy}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Seed
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset will clear all current data and reseed the investor demo. Continue?")) {
              resetMutation.mutate();
            }
          }}
          disabled={busy}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear will permanently delete all artworks, listings and transactions. Continue?")) {
              clearMutation.mutate();
            }
          }}
          disabled={busy}
          className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {error && (
        <p className="mb-4 text-xs text-red-500">{error instanceof ApiError ? error.message : "Something went wrong"}</p>
      )}

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Operation Log</h3>
      {logsQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      <ul className="flex flex-col gap-2">
        {(logsQuery.data ?? []).map((log) => (
          <li key={log.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <span>
              {log.operation}
              {log.datasetName && <span className="text-neutral-400"> · {log.datasetName}</span>}
              {log.performedBy && <span className="text-neutral-400"> · by {log.performedBy.displayName}</span>}
            </span>
            <span className="text-xs text-neutral-400">{dateFormat.format(new Date(log.createdAt))}</span>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
