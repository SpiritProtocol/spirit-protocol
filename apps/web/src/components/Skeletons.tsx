import { ScreenHeader } from "./ScreenHeader";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-100 motion-reduce:animate-none ${className}`} />;
}

export function CollectionSkeleton() {
  return (
    <div className="pb-4" aria-busy="true" aria-label="Loading collection">
      <ScreenHeader title="Spirit Protocol" badge="Mainnet" />

      <div className="mx-5 mt-2 mb-6 rounded-2xl border border-neutral-200 p-5">
        <Block className="mb-2 h-3 w-36" />
        <Block className="h-9 w-48" />
      </div>

      <div className="mb-3 flex items-center justify-between px-5">
        <Block className="h-3 w-28" />
        <Block className="h-3 w-12" />
      </div>

      <div className="flex flex-col gap-3 px-5">
        {[0, 1, 2].map((key) => (
          <div key={key} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3">
            <Block className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Block className="mb-2 h-4 w-3/5" />
              <Block className="mb-2 h-3 w-2/5" />
              <Block className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="pb-4" aria-busy="true" aria-label="Loading store">
      <ScreenHeader title="Spirit Store" />

      <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2">
        {[0, 1].map((key) => (
          <div key={key} className="overflow-hidden rounded-2xl border border-neutral-200">
            <Block className="aspect-square w-full rounded-none" />
            <div className="p-4">
              <Block className="mb-2 h-4 w-3/5" />
              <Block className="mb-4 h-3 w-2/5" />
              <Block className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
