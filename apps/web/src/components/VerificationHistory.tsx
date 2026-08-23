import type { VerificationRecordDto } from "@spirit/shared";
import { VerificationStatusBadge } from "./VerificationStatusBadge";
import { dateFormat } from "../lib/format";

export function VerificationHistory({ records }: { records: VerificationRecordDto[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-neutral-500">Not yet submitted for verification.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {records.map((record) => (
        <li key={record.id} className="rounded-xl border border-neutral-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <VerificationStatusBadge status={record.status} />
            <span className="text-xs text-neutral-400">{dateFormat.format(new Date(record.createdAt))}</span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Submitted by {record.submittedBy?.displayName ?? "—"}</p>
          {record.reviewedBy && (
            <p className="text-xs text-neutral-500">Reviewed by {record.reviewedBy.displayName}</p>
          )}
          {record.notes && <p className="mt-1 text-xs text-neutral-600">"{record.notes}"</p>}
        </li>
      ))}
    </ul>
  );
}
