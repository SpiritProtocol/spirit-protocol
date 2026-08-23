import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Cpu, Shield } from "lucide-react";
import type { ArtworkDetailDto, ProvenanceEventDto, VerificationRecordDto } from "@spirit/shared";
import { apiClient } from "../lib/apiClient";
import { FallbackImage } from "../components/FallbackImage";
import { StatusBadge } from "../components/StatusBadge";
import { VaultCard } from "../components/VaultCard";
import { VaultStatusModal } from "../components/VaultStatusModal";
import { VerificationHistory } from "../components/VerificationHistory";
import { ProvenanceTimeline } from "../components/ProvenanceTimeline";
import { PurchasePanel } from "../components/PurchasePanel";
import { currencyFormat } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const VERIFIED_STATUSES = new Set(["VERIFIED", "LISTED", "SOLD"]);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
  const [vaultModalOpen, setVaultModalOpen] = useState(false);

  const queriesEnabled = Boolean(id) && auth.status === "authenticated";
  const artworkQuery = useQuery({
    queryKey: ["artworks", id],
    queryFn: () => apiClient.get<ArtworkDetailDto>(`/artworks/${id}`),
    enabled: queriesEnabled,
  });
  const provenanceQuery = useQuery({
    queryKey: ["provenance", id],
    queryFn: () => apiClient.get<ProvenanceEventDto[]>(`/provenance/${id}`),
    enabled: queriesEnabled,
  });
  const verificationsQuery = useQuery({
    queryKey: ["verifications", id],
    queryFn: () => apiClient.get<VerificationRecordDto[]>(`/verifications/artwork/${id}`),
    enabled: queriesEnabled,
  });

  if (auth.status === "loading" || artworkQuery.isPending) {
    return <div className="p-6 text-center text-neutral-400">Loading passport…</div>;
  }

  if (auth.status === "error") {
    return <div className="p-6 text-center text-red-500">Sign-in failed: {auth.error}</div>;
  }

  if (artworkQuery.isError) {
    return <div className="p-6 text-center text-red-500">{artworkQuery.error.message}</div>;
  }

  const artwork = artworkQuery.data;
  const isVerified = VERIFIED_STATUSES.has(artwork.status);

  return (
    <div className="px-5 pt-4 pb-4">
      <div className="flex items-center justify-between pb-2">
        <Link to="/" className="flex items-center gap-1 text-[13px] font-medium text-neutral-500 active:text-neutral-900">
          <ChevronLeft size={16} strokeWidth={2} />
          Back to Collection
        </Link>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
          Mainnet
        </span>
      </div>

      {isVerified && (
        <div className="mt-3 mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3.5 py-1.5">
            <Shield size={13} strokeWidth={2} />
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase">Verified by NTAG 424 DNA</span>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
        <FallbackImage src={artwork.coverImageUrl} alt={artwork.title} className="aspect-[4/5] w-full object-cover" />
        <div className="border-t border-neutral-200 bg-white px-4 py-2.5">
          <span className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase">
            Genesis Artifact #{artwork.spiritId}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">{artwork.title}</h1>
          <p className="mt-1 text-[14px] text-neutral-400">By {artwork.artist}</p>
        </div>
        <StatusBadge status={artwork.status} />
      </div>

      {artwork.chipId && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-neutral-500">
          <Cpu size={15} strokeWidth={1.75} />
          <span>
            Chip ID: <span className="font-mono text-neutral-900">{artwork.chipId}</span>
          </span>
        </div>
      )}

      <p className="mt-3 text-xl font-semibold">{currencyFormat.format(artwork.value)}</p>

      {artwork.activeListing && (
        <>
          <p className="mt-1 text-sm text-sky-600">
            Listed at {currencyFormat.format(artwork.activeListing.price)} by{" "}
            {artwork.activeListing.seller.displayName}
          </p>
          <PurchasePanel artworkId={artwork.id} listing={artwork.activeListing} />
        </>
      )}

      {artwork.description && <p className="mt-4 text-sm text-neutral-600">{artwork.description}</p>}

      {artwork.vault && (
        <div className="mt-5">
          <VaultCard vault={artwork.vault} />
        </div>
      )}

      {artwork.vault?.status === "ACTIVE" && (
        <button
          type="button"
          onClick={() => setVaultModalOpen(true)}
          className="mt-2.5 w-full rounded-xl bg-black py-3.5 text-[13px] font-medium tracking-[0.05em] text-white active:opacity-80"
        >
          [ Check Vault Status ]
        </button>
      )}

      <Section title="Digital Passport">
        <dl className="grid grid-cols-2 gap-y-3 rounded-xl border border-neutral-200 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-neutral-400">Spirit ID</dt>
            <dd className="font-mono">{artwork.spiritId}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Chip ID</dt>
            <dd className="font-mono">{artwork.chipId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Year</dt>
            <dd>{artwork.year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Medium</dt>
            <dd>{artwork.medium ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Dimensions</dt>
            <dd>{artwork.dimensions ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Owner</dt>
            <dd>{artwork.currentOwner?.displayName ?? "—"}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Verification">
        {verificationsQuery.isPending ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <VerificationHistory records={verificationsQuery.data ?? []} />
        )}
      </Section>

      <Section title="Provenance">
        {provenanceQuery.isPending ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <ProvenanceTimeline events={provenanceQuery.data ?? []} />
        )}
      </Section>

      {vaultModalOpen && artwork.vault && (
        <VaultStatusModal title={artwork.title} vault={artwork.vault} onClose={() => setVaultModalOpen(false)} />
      )}
    </div>
  );
}
