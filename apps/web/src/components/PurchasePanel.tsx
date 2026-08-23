import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ListingDto, TransactionDto } from "@spirit/shared";
import { apiClient, ApiError } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { currencyFormat } from "../lib/format";

export function PurchasePanel({ artworkId, listing }: { artworkId: string; listing: ListingDto }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [transaction, setTransaction] = useState<TransactionDto | null>(null);

  const initiateMutation = useMutation({
    mutationFn: () => apiClient.post<TransactionDto>("/purchases", { listingId: listing.id }),
    onSuccess: setTransaction,
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiClient.post<TransactionDto>("/purchases/confirm", { transactionId: transaction!.id }),
    onSuccess: (tx) => {
      setTransaction(tx);
      void queryClient.invalidateQueries({ queryKey: ["artworks"] });
      void queryClient.invalidateQueries({ queryKey: ["provenance", artworkId] });
      void queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
  });

  if (auth.user && auth.user.id === listing.seller.id) {
    return <p className="mt-3 text-sm text-neutral-500">This is your listing.</p>;
  }

  if (transaction?.status === "COMPLETED") {
    return (
      <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        Purchase complete — this artwork is now in your collection.
      </div>
    );
  }

  if (transaction?.status === "FAILED") {
    return <p className="mt-3 text-sm text-red-400">Payment failed. Please try again.</p>;
  }

  const error = initiateMutation.error ?? confirmMutation.error;

  if (transaction) {
    return (
      <div className="mt-3 rounded-xl border border-neutral-200 p-4">
        <p className="text-sm text-neutral-600">Wallet connected. Confirm payment of {currencyFormat.format(listing.price)}?</p>
        <button
          type="button"
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending}
          className="mt-3 w-full rounded-xl bg-black py-3.5 text-[13px] font-medium tracking-[0.05em] text-white active:opacity-80 disabled:opacity-50"
        >
          {confirmMutation.isPending ? "Confirming payment…" : "[ Confirm Payment ]"}
        </button>
        {error && <p className="mt-2 text-xs text-red-500">{error instanceof ApiError ? error.message : "Something went wrong"}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => initiateMutation.mutate()}
        disabled={initiateMutation.isPending}
        className="w-full rounded-xl border border-neutral-200 py-3.5 text-[13px] font-medium tracking-[0.05em] active:bg-neutral-50 disabled:opacity-50"
      >
        {initiateMutation.isPending ? "Connecting wallet…" : `[ Connect Wallet — Buy for ${currencyFormat.format(listing.price)} ]`}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error instanceof ApiError ? error.message : "Something went wrong"}</p>}
    </div>
  );
}
