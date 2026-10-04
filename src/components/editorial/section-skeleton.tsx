import { cn } from "@/lib/utils";

/**
 * Editorial loading skeleton for section indexes (Reviews, Best, Guides…).
 * Mirrors the real page's rhythm — eyebrow, display headline, deck, then a
 * card grid — so the swap from skeleton to content reads as one continuous
 * layout rather than a jump. Pure CSS (animate-pulse), zero JS, no CLS.
 */
export function SectionSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
          <p className="eyebrow flex items-center gap-2 text-vermilion">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-vermilion"
              aria-hidden="true"
            />
            {label}
          </p>
          <div className="mt-3 h-10 w-72 max-w-full animate-pulse rounded-sm bg-muted sm:h-12" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-sm bg-muted" />
          <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded-sm bg-muted" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-md border border-border bg-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <p className="h-2.5 w-24 animate-pulse rounded-sm bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded-sm bg-muted" />
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="h-3 w-20 animate-pulse rounded-sm bg-muted" />
                  <div className="h-3 w-10 animate-pulse rounded-sm bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Article-body skeleton for individual story pages — headline block, deck,
 * hairline rows of prose-length bars and a tall hero placeholder.
 */
export function ArticleSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" role="status" className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-5">
          <p className="eyebrow flex items-center gap-2 text-vermilion">
            <span
              className={cn("inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-vermilion")}
              aria-hidden="true"
            />
            {label}
          </p>
          <div className="h-9 w-full max-w-2xl animate-pulse rounded-sm bg-muted" />
          <div className="h-9 w-3/4 max-w-xl animate-pulse rounded-sm bg-muted" />
          <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-2/3 max-w-md animate-pulse rounded-sm bg-muted" />
          <div className="mt-6 aspect-[16/9] w-full animate-pulse rounded-md bg-muted" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded-sm bg-muted"
                style={{ width: `${88 - ((i * 13) % 24)}%` }}
              />
            ))}
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-2.5 border-l border-border pl-5">
            <div className="h-2.5 w-16 animate-pulse rounded-sm bg-muted" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-3 animate-pulse rounded-sm bg-muted" style={{ width: `${80 - i * 10}%` }} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
