import { SectionHeading } from "@/components/editorial/section-heading";
import { ArticleCard } from "@/components/editorial/article-card";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";
import { getArticlesByType, getComparisonTeasers } from "@/lib/queries";
import { articlePath, articleTypeLabels, type ArticleType } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

const intros: Record<string, { title: string; deck: string }> = {
  review: {
    title: "Reviews",
    deck: "One product, tested properly: the score, the breakdown, the trade-offs, and who should buy it instead. Every review links to the methodology behind it.",
  },
  roundup: {
    title: "Best picks",
    deck: "Ranked shortlists with the reasoning shown. No hedging, no pay-to-win — if we recommend it, we explain why it beats the alternatives.",
  },
  versus: {
    title: "Comparisons",
    deck: "Head-to-head breakdowns on the criteria that actually change a buying decision. Sort the table, read the verdict, then disagree with us properly.",
  },
  guide: {
    title: "Guides",
    deck: "Plain-English explainers that teach you how to evaluate a category yourself — because the best buying decision is an informed one.",
  },
  editorial: {
    title: "Editorial",
    deck: "Opinion and notes from the desk: how we work, what we got wrong, and where independent publishing goes next.",
  },
};

/** Shared index page for a single article type (reviews, best, compare, guides, articles). */
export async function TypeIndex({ type }: { type: ArticleType }) {
  const articles = await getArticlesByType(type, 30);
  const comparisons = type === "versus" ? await getComparisonTeasers() : [];
  const intro = intros[type] ?? { title: articleTypeLabels[type], deck: "" };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: intro.title, href: articlePath(type, "_").replace(/\/_$/, "") },
          ]),
          ...(articles.length > 0
            ? [
                itemListJsonLd(
                  intro.title,
                  articles.map((a) => ({ name: a.title, url: articlePath(a.type, a.slug) }))
                ),
              ]
            : []),
        ]}
      />
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
          <p className="eyebrow text-vermilion">Duyan Blog</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{intro.title}<span className="text-vermilion">.</span></h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro.deck}</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        {articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <Reveal key={article.id}>
                <ArticleCard article={article} priority={i < 3} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
            Nothing published in this section yet. Run{" "}
            <code className="rounded-sm bg-muted px-1.5 py-0.5">npm run seed:demo</code> to load the sample issue.
          </p>
        )}

        {/* Versus-only teaser: the tables behind the verdicts, with score chips. */}
        {comparisons.length > 0 && (
          <section aria-label="The tables behind the verdicts" className="mt-14">
            <Reveal>
              <div className="rounded-md border border-border bg-muted/30 p-6 sm:p-8">
                <p className="eyebrow text-vermilion">In numbers</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  The tables behind the verdicts<span className="text-vermilion">.</span>
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Every comparison ships with a sortable spec table — prices, renewal terms,
                  measured numbers — so you can re-run our reasoning line by line.
                </p>
                <ul className="mt-6 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
                  {comparisons.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={c.article ? articlePath(c.article.type, c.article.slug) : `/compare/${c.slug}`}
                        className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-display text-base font-semibold leading-snug group-hover:underline underline-offset-4 decoration-sun">
                          {c.title}
                        </span>
                        <span className="flex shrink-0 flex-wrap items-center gap-2">
                          {c.items.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-baseline gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-xs"
                            >
                              <span className="text-muted-foreground">{item.name}</span>
                              {item.score != null && (
                                <strong className="font-display text-sm font-semibold text-primary">{item.score.toFixed(1)}</strong>
                              )}
                            </span>
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </section>
        )}
      </div>
    </>
  );
}

export function typeIndexMetadata(type: ArticleType): Metadata {
  const intro = intros[type];
  return buildMetadata({
    title: intro.title,
    description: intro.deck,
    path: articlePath(type, "_").replace(/\/_$/, ""),
  });
}
