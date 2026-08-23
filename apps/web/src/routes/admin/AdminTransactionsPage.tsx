import { useQuery } from "@tanstack/react-query";
import type { TransactionDto } from "@spirit/shared";
import { apiClient } from "../../lib/apiClient";
import { AdminShell } from "../../components/admin/AdminShell";
import { AdminTransactionRow } from "../../components/admin/AdminTransactionRow";

export function AdminTransactionsPage() {
  const query = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => apiClient.get<TransactionDto[]>("/admin/transactions"),
  });

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Transactions</h2>

      {query.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {query.isError && <p className="text-sm text-red-400">{query.error.message}</p>}
      {!query.isLoading && (query.data ?? []).length === 0 && (
        <p className="text-sm text-neutral-500">No transactions yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {(query.data ?? []).map((tx) => (
          <AdminTransactionRow key={tx.id} transaction={tx} />
        ))}
      </ul>
    </AdminShell>
  );
}
