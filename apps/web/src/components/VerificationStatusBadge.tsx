import type { VerificationStatus } from "@spirit/shared";

const STYLES: Record<VerificationStatus, string> = {
  PENDING: "bg-neutral-100 text-neutral-500",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-neutral-900 text-white",
  REJECTED: "bg-red-50 text-red-600",
};

const LABELS: Record<VerificationStatus, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>
  );
}
