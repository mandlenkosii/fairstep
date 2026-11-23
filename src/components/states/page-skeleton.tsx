/** Shown while a page loads: grey blocks in the shape of a typical page. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div aria-hidden className="animate-pulse">
        <div className="h-4 w-40 rounded bg-line" />
        <div className="mt-3 h-8 w-72 max-w-full rounded bg-line" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-line bg-surface" />
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-line bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
