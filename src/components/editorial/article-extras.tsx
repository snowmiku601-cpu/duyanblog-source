import Link from "next/link";
import { AlertTriangle, BookOpen } from "lucide-react";

/** TL;DR box at the top of reviews/roundups/versus pages. */
export function TldrBox({ text }: { text: string }) {
  return (
    <aside aria-label="TL;DR" className="rounded-md border border-border bg-secondary/25 p-5">
      <p className="eyebrow text-secondary-foreground/80">The short version</p>
      <p className="mt-2 font-display text-lg leading-relaxed">{text}</p>
    </aside>
  );
}

/** Editorial corrections/demo notice. */
export function DemoNotice() {
  return (
    <p className="flex items-start gap-2 rounded-sm border border-dashed border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ochre" aria-hidden="true" />
      <span>
        <strong className="font-semibold text-foreground/80">Sample content:</strong> the product,
        merchants and offers on this page are fictional demo data, published to show how real
        reviews will look. Nothing here is a real recommendation.
      </span>
    </p>
  );
}

/** Sources & citations rendered from the SourceCitation table. */
export function SourcesList({ sources }: { sources: { id: string; label: string; url: string | null }[] }) {
  if (sources.length === 0) return null;
  return (
    <section aria-label="Sources" className="prose-measure">
      <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
        <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        Sources
      </h2>
      <ol className="mt-3 space-y-2 text-sm">
        {sources.map((s, i) => (
          <li key={s.id} className="flex gap-3">
            <span className="section-index mt-0.5 text-muted-foreground/70">[{i + 1}]</span>
            {s.url ? (
              <a href={s.url} rel="noopener nofollow" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                {s.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span>{s.label}</span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Spotted an error? Our <Link href="/corrections-policy" className="underline underline-offset-2">corrections policy</Link> explains how we fix things — publicly.
      </p>
    </section>
  );
}
