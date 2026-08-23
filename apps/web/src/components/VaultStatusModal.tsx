import { Lock, TrendingUp, X } from "lucide-react";
import type { VaultSummaryDto } from "@spirit/shared";
import { currencyFormat, dateFormat } from "../lib/format";

const MOCK_ACTIVITY = [
  { label: "Vault funded", date: new Date(), amount: "funded" as const },
  { label: "Custody attestation", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), status: "Verified" },
  { label: "Chip re-scan", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), status: "Confirmed" },
];

export function VaultStatusModal({
  title,
  vault,
  onClose,
}: {
  title: string;
  vault: VaultSummaryDto;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative mx-auto max-h-[88%] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-neutral-200 bg-white">
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-9 rounded-full bg-neutral-200" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div>
            <div className="mb-0.5 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">
              Live Vault Analytics
            </div>
            <h2 className="text-[18px] font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 active:bg-neutral-50"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="mx-5 h-px bg-neutral-200" />

        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          <div className="rounded-xl border border-neutral-200 p-3.5">
            <div className="mb-1 text-[10px] tracking-[0.1em] text-neutral-400 uppercase">Vault Balance</div>
            <div className="font-mono text-[16px] font-semibold">{currencyFormat.format(vault.guaranteedFloor)}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3.5">
            <div className="mb-1 text-[10px] tracking-[0.1em] text-neutral-400 uppercase">Coverage</div>
            <div className="font-mono text-[16px] font-semibold">{vault.coveragePercent}%</div>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3.5">
            <div className="mb-1 text-[10px] tracking-[0.1em] text-neutral-400 uppercase">Yield (30d)</div>
            <div className="flex items-center gap-1 font-mono text-[16px] font-semibold">
              <TrendingUp size={13} strokeWidth={2} />
              +1.8%
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3.5">
            <div className="mb-1 text-[10px] tracking-[0.1em] text-neutral-400 uppercase">Lock Status</div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium">
              <Lock size={13} strokeWidth={2} />
              Locked
            </div>
          </div>
        </div>

        <div className="px-5 pb-2">
          <div className="mb-2 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">Redemption Activity</div>
          <div className="flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200">
            {MOCK_ACTIVITY.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-3.5 py-3">
                <div>
                  <div className="text-[13px] font-medium">{row.label}</div>
                  <div className="text-[11px] text-neutral-400">{dateFormat.format(row.date)}</div>
                </div>
                <span className="font-mono text-[12px] text-neutral-500">
                  {row.amount ? `+${currencyFormat.format(vault.guaranteedFloor)}` : row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-5">
          <button
            type="button"
            disabled
            title="Demo simulation — vault redemption is not implemented in this MVP"
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-[13px] font-medium tracking-[0.05em] text-white opacity-40"
          >
            [ Redeem Vault Floor ]
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-neutral-400">
            Demo simulation — not a real financial guarantee. Redemption, yield and buyback are not implemented in
            this MVP.
          </p>
        </div>
      </div>
    </div>
  );
}
