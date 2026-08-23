import { useQuery } from "@tanstack/react-query";
import type { CollectionDto } from "@spirit/shared";
import { apiClient } from "../lib/apiClient";
import { ScreenHeader } from "../components/ScreenHeader";
import { VaultSummaryCard } from "../components/VaultSummaryCard";
import { ArtworkRowCard } from "../components/ArtworkRowCard";
import { TransactionRow } from "../components/TransactionRow";
import { useAuth } from "../context/AuthContext";

export function CollectionPage() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["collection"],
    queryFn: () => apiClient.get<CollectionDto>("/collection"),
    enabled: auth.status === "authenticated",
  });

  if (auth.status === "loading" || query.isLoading) {
    return <div className="p-6 text-center text-neutral-400">Loading collection…</div>;
  }

  if (auth.status === "error") {
    return <div className="p-6 text-center text-red-400">Sign-in failed: {auth.error}</div>;
  }

  if (query.isError) {
    return <div className="p-6 text-center text-red-400">{query.error.message}</div>;
  }

  const { artworks, transactions } = query.data!;

  return (
    <div className="pb-4">
      <ScreenHeader title="Spirit Protocol" badge="Mainnet" />

      <VaultSummaryCard artworks={artworks} />

      <div className="mb-3 flex items-center justify-between px-5">
        <span className="text-[11px] tracking-[0.15em] text-neutral-400 uppercase">Your Collection</span>
        <span className="font-mono text-[11px] text-neutral-400">{artworks.length} items</span>
      </div>

      {artworks.length === 0 ? (
        <p className="px-5 text-neutral-400">You don't own any artworks yet.</p>
      ) : (
        <div className="flex flex-col gap-3 px-5">
          {artworks.map((artwork) => (
            <ArtworkRowCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}

      {transactions.length > 0 && (
        <section className="mt-8 px-5">
          <h2 className="mb-3 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">Transaction History</h2>
          <ul className="flex flex-col gap-3">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} currentUserId={auth.user!.id} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
