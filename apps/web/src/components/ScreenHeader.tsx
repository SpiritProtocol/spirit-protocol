export function ScreenHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <span className="text-[13px] font-semibold tracking-[0.2em] uppercase">{title}</span>
      {badge && (
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
          {badge}
        </span>
      )}
    </div>
  );
}
