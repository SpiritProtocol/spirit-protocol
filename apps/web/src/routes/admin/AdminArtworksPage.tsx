import { useQuery } from "@tanstack/react-query";
import type { ArtworkSummaryDto, UserDto } from "@spirit/shared";
import { apiClient } from "../../lib/apiClient";
import { AdminShell } from "../../components/admin/AdminShell";
import { ArtworkAdminRow } from "../../components/admin/ArtworkAdminRow";
import { CreateArtworkForm } from "../../components/admin/CreateArtworkForm";

export function AdminArtworksPage() {
  const artworksQuery = useQuery({
    queryKey: ["artworks"],
    queryFn: () => apiClient.get<ArtworkSummaryDto[]>("/artworks"),
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get<UserDto[]>("/admin/users"),
  });

  const users = usersQuery.data ?? [];

  return (
    <AdminShell>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Artworks</h2>

      <CreateArtworkForm users={users} />

      {artworksQuery.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {artworksQuery.isError && <p className="text-sm text-red-400">{artworksQuery.error.message}</p>}

      <ul className="flex flex-col gap-3">
        {(artworksQuery.data ?? []).map((artwork) => (
          <ArtworkAdminRow key={artwork.id} artwork={artwork} users={users} />
        ))}
      </ul>
    </AdminShell>
  );
}
