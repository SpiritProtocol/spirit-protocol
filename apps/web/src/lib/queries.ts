import { queryOptions } from "@tanstack/react-query";
import type { ArtworkSummaryDto, CollectionDto } from "@spirit/shared";
import { apiClient } from "./apiClient";

export const collectionQuery = () =>
  queryOptions({
    queryKey: ["collection"],
    queryFn: () => apiClient.get<CollectionDto>("/collection"),
  });

export const storeQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["artworks", "store", userId],
    queryFn: () => apiClient.get<ArtworkSummaryDto[]>(`/artworks?excludeOwnerId=${userId}`),
  });
