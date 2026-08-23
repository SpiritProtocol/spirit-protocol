import type { TransactionStatus } from "@spirit/shared";

const STYLES: Record<TransactionStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-neutral-900 text-white",
  FAILED: "bg-red-50 text-red-600",
  CANCELLED: "bg-neutral-100 text-neutral-400",
};

const LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>
  );
}
