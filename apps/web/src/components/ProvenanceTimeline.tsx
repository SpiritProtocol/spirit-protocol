import type { ProvenanceEventDto } from "@spirit/shared";
import { PROVENANCE_EVENT_LABELS } from "../lib/provenanceLabels";
import { dateFormat } from "../lib/format";

function describeOwnership(event: ProvenanceEventDto): string | null {
  if (!event.fromOwner && !event.toOwner) return null;
  if (event.fromOwner && event.toOwner) return `${event.fromOwner.displayName} → ${event.toOwner.displayName}`;
  if (event.toOwner) return `to ${event.toOwner.displayName}`;
  return null;
}

export function ProvenanceTimeline({ events }: { events: ProvenanceEventDto[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-neutral-500">No provenance events yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {[...events].reverse().map((event) => {
        const ownership = describeOwnership(event);
        return (
          <li key={event.id} className="flex gap-3">
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium">{PROVENANCE_EVENT_LABELS[event.type]}</span>
                <span className="text-xs text-neutral-400">{dateFormat.format(new Date(event.createdAt))}</span>
              </div>
              {ownership && <p className="text-xs text-neutral-500">{ownership}</p>}
              {event.actor && <p className="text-xs text-neutral-400">by {event.actor.displayName}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
