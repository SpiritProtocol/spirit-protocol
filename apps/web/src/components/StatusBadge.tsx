import type { ArtworkStatus } from "@spirit/shared";

const STYLES: Record<ArtworkStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-neutral-900 text-white",
  REJECTED: "bg-red-50 text-red-600",
  LISTED: "bg-sky-50 text-sky-700",
  SOLD: "bg-violet-50 text-violet-700",
  ARCHIVED: "bg-neutral-100 text-neutral-400",
};

export const ARTWORK_STATUS_LABELS: Record<ArtworkStatus, string> = {
  DRAFT: "Draft",
  PENDING_VERIFICATION: "Pending Verification",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  LISTED: "Listed",
  SOLD: "Sold",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: ArtworkStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>
      {ARTWORK_STATUS_LABELS[status]}
    </span>
  );
}
