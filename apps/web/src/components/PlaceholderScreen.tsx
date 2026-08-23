import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PlaceholderScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="mb-2 text-[11px] tracking-[0.15em] text-neutral-400 uppercase">{eyebrow}</div>
      <h2 className="mb-2 text-[19px] font-semibold">{title}</h2>
      <p className="max-w-[240px] text-[13px] leading-relaxed text-neutral-400">{description}</p>
      {action && <div className="mt-6 w-full max-w-[260px]">{action}</div>}
    </div>
  );
}
