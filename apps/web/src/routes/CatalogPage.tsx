import { useQuery } from "@tanstack/react-query";
import type { ArtworkSummaryDto } from "@spirit/shared";
import { apiClient } from "../lib/apiClient";
import { ArtworkCard } from "../components/ArtworkCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../context/AuthContext";

export function CatalogPage() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["artworks", "store", auth.user?.id],
    queryFn: () => apiClient.get<ArtworkSummaryDto[]>(`/artworks?excludeOwnerId=${auth.user!.id}`),
    enabled: auth.status === "authenticated",
  });

  if (auth.status === "loading" || query.isLoading) {
    return <div className="p-6 text-center text-neutral-400">Loading catalog…</div>;
  }

  if (auth.status === "error") {
    return <div className="p-6 text-center text-red-400">Sign-in failed: {auth.error}</div>;
  }

  if (query.isError) {
    return <div className="p-6 text-center text-red-400">{query.error.message}</div>;
  }

  const artworks = query.data ?? [];

  return (
    <div className="pb-4">
      <ScreenHeader title="Spirit Store" />
      <div className="px-5">
        <AppHeader />
        {artworks.length === 0 ? (
          <p className="text-neutral-400">No artworks yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
