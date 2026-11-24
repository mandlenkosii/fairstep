/** Shown while a page loads: soft shimmering blocks in the shape of a typical page. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div aria-hidden>
        <div className="h-4 w-40 skeleton rounded" />
        <div className="mt-3 h-8 w-72 max-w-full skeleton rounded" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-4">
              <div className="h-3 w-20 skeleton rounded" />
              <div className="mt-3 h-7 w-12 skeleton rounded" />
              <div className="mt-3 h-3 w-28 max-w-full skeleton rounded" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <div className="size-11 shrink-0 skeleton rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-48 max-w-full skeleton rounded" />
                <div className="mt-2 h-3 w-72 max-w-full skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
