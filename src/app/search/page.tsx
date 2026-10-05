import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/search-input";
import { ArticleRow } from "@/components/editorial/article-card";
import { buildMetadata } from "@/lib/seo";
import { db } from "@/lib/db";
import { toCardData, articleCardSelect, demoExcludedWhere, liveDateGuard } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search reviews, comparisons, guides and editorial on Duyan Blog.",
  path: "/search",
  noIndex: true,
});

type SearchParams = { searchParams: Promise<{ q?: string; cat?: string }> };

/**
 * Server-side search over published articles. SQLite lacks Prisma's
 * case-insensitive filter, so we filter in JS — fine at editorial scale and
 * ready to swap for FTS5 later (see ARCHITECTURE.md).
 * `?cat=<slug>` narrows results to one section via the chip row.
 */
export default async function SearchPage({ searchParams }: SearchParams) {
  const { q, cat } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);
  const catFilter = (cat ?? "").trim().slice(0, 80);

  const [rows, categories] = await Promise.all([
    query.length > 0
      ? db.article.findMany({
          where: { status: "published", ...liveDateGuard(), ...demoExcludedWhere },
          orderBy: [{ publishedAt: "desc" }],
          take: 100,
          select: articleCardSelect,
        })
      : Promise.resolve([]),
    db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
  ]);

  const activeCategory = categories.find((c) => c.slug === catFilter) ?? null;

  const needle = query.toLowerCase();
  const results = rows
    .map(toCardData)
    .filter((a) =>
      needle.length === 0
        ? false
        : [a.title, a.deck, a.categoryName, a.authorName].some((f) => f.toLowerCase().includes(needle))
    )
    .filter((a) => (activeCategory ? a.categorySlug === activeCategory.slug : true))
    .slice(0, 30);

  /** Chip href preserving the query string. */
  const chipHref = (slug: string | null) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (slug) params.set("cat", slug);
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  const chipBase =
    "inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const chipOn = "border-vermilion bg-vermilion text-white hover:bg-vermilion/90";
  const chipOff =
    "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-6 lg:py-16">
      <p className="eyebrow text-vermilion">Search</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Find the verdict<span className="text-vermilion">.</span></h1>

      <form action="/search" method="GET" role="search" className="mt-8 flex gap-2">
        <label htmlFor="q" className="sr-only">Search duyanblog.com</label>
        {activeCategory && <input type="hidden" name="cat" value={activeCategory.slug} />}
        <SearchInput defaultValue={query} className="h-12 bg-card" />
        <Button type="submit" className="h-12 font-medium">Search</Button>
      </form>

      {/* Section chips — narrow results to one category */}
      {categories.length > 0 && (
        <nav aria-label="Filter by section" className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={chipHref(null)}
            aria-current={!activeCategory ? "true" : undefined}
            className={cn(chipBase, !activeCategory ? chipOn : chipOff)}
          >
            All sections
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={chipHref(category.slug)}
              aria-current={activeCategory?.slug === category.slug ? "true" : undefined}
              className={cn(chipBase, activeCategory?.slug === category.slug ? chipOn : chipOff)}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-10" aria-live="polite">
        {query.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Type a query above, or browse{" "}
            <Link href="/reviews" className="underline underline-offset-2 hover:text-foreground">reviews</Link>,{" "}
            <Link href="/best" className="underline underline-offset-2 hover:text-foreground">best picks</Link> and{" "}
            <Link href="/guides" className="underline underline-offset-2 hover:text-foreground">guides</Link>.
          </p>
        ) : results.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <SearchX className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-semibold">
              Nothing for “{query}”
              {activeCategory && (
                <> in <span className="text-foreground">{activeCategory.name}</span></>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeCategory ? (
                <>
                  Try{" "}
                  <Link href={chipHref(null)} className="underline underline-offset-2 hover:text-foreground">
                    all sections
                  </Link>{" "}
                  — or a broader term.
                </>
              ) : (
                <>
                  Try a broader term — or{" "}
                  <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
                    suggest what we should review next
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} for{" "}
              <strong className="text-foreground">“{query}”</strong>
              {activeCategory && (
                <>
                  {" "}in <strong className="text-foreground">{activeCategory.name}</strong>
                </>
              )}
            </p>
            <ul className="mt-4 border-t border-border">
              {results.map((article, i) => (
                <ArticleRow key={article.id} article={article} index={i + 1} highlight={query} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
