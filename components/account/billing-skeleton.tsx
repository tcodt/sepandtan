export function SummarySkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card/80 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="در حال بارگذاری">
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-start gap-3 rounded-2xl border border-border bg-card/80 p-3.5"
        >
          <div className="size-10 shrink-0 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-3.5 w-24 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
