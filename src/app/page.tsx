import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/editorial/section-heading";
import { ArticleCard, ArticleRow, FeatureCard } from "@/components/editorial/article-card";
import { AffiliateButton } from "@/components/affiliate/affiliate-link";
import { NewsletterForm } from "@/components/newsletter-form";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import {
  getCategories,
  getFeaturedArticle,
  getHomepageStats,
  getLatestArticles,
  getArticlesByType,
  liveDateGuard,
} from "@/lib/queries";
import { db } from "@/lib/db";
import { parseBlocks } from "@/lib/content-schema";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const [stats, categories, featured, latest, guides, deals] = await Promise.all([
    getHomepageStats(),
    getCategories(),
    getFeaturedArticle(),
    getLatestArticles(6),
    getArticlesByType("guide", 2),
    db.affiliateOffer.findMany({
      where: { active: true, isDeal: true },
      include: { merchant: { select: { name: true } } },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      take: 3,
    }),
  ]);

  const topComparison = await db.comparison.findFirst({
    include: { items: { orderBy: { order: "asc" } }, article: { select: { slug: true, type: true } } },
  });

  const roundup = await db.article.findFirst({
    where: { status: "published", type: "roundup", ...liveDateGuard() },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, type: true, title: true, blocks: true },
  });
  const picks = roundup
    ? parseBlocks(roundup.blocks)
        .filter((b) => b.type === "pick")
        .slice(0, 3)
    : [];

  const wire = latest.filter((a) => a.id !== featured?.id).slice(0, 5);

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

      {/* ------------------------------------------------ Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-sun/25" />
          <div className="absolute -right-24 -top-32 h-[30rem] w-[30rem] rounded-full border border-border" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 lg:grid-cols-12 lg:gap-8 lg:px-6 lg:pb-24 lg:pt-20">
          <Reveal className="lg:col-span-7" as="header">
            <p className="eyebrow text-vermilion">
              Nº 01 — Software · Travel · Tech
            </p>
            <h1 id="hero-title" className="mt-4 font-display text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.4rem]">
              Reviews with<br />
              reasons attached<span className="text-vermilion">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Duyan Blog is an independent editorial publication. We review software,
              travel and technology with the methodology, sources and trade-offs in
              the open — so you can disagree with us properly.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="font-medium">
                <Link href="/reviews">Start with a review</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-medium">
                <Link href="/methodology">How we test</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Reader-supported: we may earn a commission when you buy through our links.{" "}
              <Link href="/how-we-make-money" className="underline underline-offset-2 hover:text-foreground">
                Here&apos;s exactly how that works.
              </Link>
            </p>
          </Reveal>

          <Reveal className="lg:col-span-5" as="div">
            <div className="relative mx-auto max-w-sm lg:mt-2">
              {/* Sun + nón lá composition */}
              <svg viewBox="0 0 400 340" role="img" aria-label="A geometric sun rising behind a Vietnamese conical hat — the Duyan Blog mark" className="w-full">
                <circle cx="238" cy="132" r="108" fill="var(--sun)" className="animate-drift" />
                <circle cx="238" cy="132" r="126" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                <line x1="24" y1="300" x2="376" y2="300" stroke="var(--foreground)" strokeWidth="2" />
                <line x1="24" y1="312" x2="240" y2="312" stroke="var(--border)" strokeWidth="1.5" />
                <g transform="translate(96 118) scale(3.2)">
                  <path
                    fill="var(--foreground)"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M32 8 L59 49 Q32 57.5 5 49 Z M16.85 31 Q32 34.5 47.15 31 L47.15 34.5 Q32 38 16.85 34.5 Z M9.6 42 Q32 45.5 54.4 42 L54.4 45.5 Q32 49 9.6 45.5 Z M29.4 21.5 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0 Z"
                  />
                </g>
                <circle cx="330" cy="52" r="5" fill="var(--vermilion)" />
                <circle cx="66" cy="80" r="3" fill="var(--primary)" />
              </svg>
              <dl className="absolute -bottom-2 left-0 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border shadow-sm sm:-left-6">
                <div className="bg-card px-4 py-3">
                  <dd className="font-display text-xl font-semibold">{stats.articles}</dd>
                  <dt className="text-[11px] leading-tight text-muted-foreground">published pieces</dt>
                </div>
                <div className="bg-card px-4 py-3">
                  <dd className="font-display text-xl font-semibold">0</dd>
                  <dt className="text-[11px] leading-tight text-muted-foreground">paid placements</dt>
                </div>
                <div className="bg-card px-4 py-3">
                  <dd className="font-display text-xl font-semibold">{stats.categories}</dd>
                  <dt className="text-[11px] leading-tight text-muted-foreground">sections</dt>
                </div>
                <div className="bg-card px-4 py-3">
                  <dd className="font-display text-xl font-semibold">{stats.comparisons}</dd>
                  <dt className="text-[11px] leading-tight text-muted-foreground">head-to-heads</dt>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ 01 Featured + the wire */}
      <section aria-label="Featured story and latest" className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <Reveal>
          <SectionHeading index="01" title="This week's feature" href="/reviews" />
        </Reveal>
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            {featured ? (
              <FeatureCard article={featured} priority />
            ) : (
              <p className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
                No stories published yet. Run <code className="rounded-sm bg-muted px-1.5 py-0.5">npm run seed:demo</code> to load the sample issue.
              </p>
            )}
          </Reveal>
          <div className="lg:col-span-4">
            <h3 className="eyebrow border-b border-border pb-3 text-muted-foreground">The wire</h3>
            <ul className="scroll-thin max-h-96 overflow-y-auto">
              {wire.map((article, i) => (
                <ArticleRow key={article.id} article={article} index={i + 1} />
              ))}
              {wire.length === 0 && (
                <li className="py-4 text-sm text-muted-foreground">Nothing else yet — the wire fills up as we publish.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 02 Sections */}
      <section aria-labelledby="sections-title" className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <Reveal>
            <SectionHeading index="02" title="Where to get lost" href="#sections-title" linkLabel="Three sections, no filler" id="sections-title" />
          </Reveal>
          <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
            {categories.map((category, i) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="group relative flex min-h-56 flex-col justify-between bg-card p-6 transition-colors hover:bg-accent/60"
              >
                <div className="flex items-start justify-between">
                  <span className="section-index text-vermilion">0{i + 1}</span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{category.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{category.tagline}</p>
                </div>
                <p className="mt-4 border-t border-border pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {category.description.split(".")[0]}
                </p>
              </Link>
            ))}
            {categories.length === 0 && (
              <div className="bg-card p-8 text-sm text-muted-foreground md:col-span-3">Sections appear here once the demo seed runs.</div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 03 Head to head */}
      {topComparison && topComparison.items.length >= 2 && (
        <section aria-labelledby="compare-title" className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <Reveal>
            <SectionHeading index="03" title="Head to head" href="/compare" linkLabel="All comparisons" />
          </Reveal>
          <Reveal className="mt-8 grid items-stretch gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-vermilion">Versus</p>
              <h3 id="compare-title" className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
                {topComparison.title}
              </h3>
              {topComparison.intro && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{topComparison.intro}</p>
              )}
              <Button asChild variant="outline" className="mt-6 font-medium">
                <Link
                  href={
                    topComparison.article
                      ? articlePath(topComparison.article.type, topComparison.article.slug)
                      : "/compare"
                  }
                >
                  Read the full breakdown <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:col-span-7">
              {topComparison.items.slice(0, 2).map((item) => (
                <div key={item.id} className="flex flex-col bg-card p-5">
                  <p className="eyebrow text-muted-foreground">{item.summary ? "Contender" : ""}</p>
                  <p className="mt-1 font-display text-xl font-semibold leading-snug">{item.name}</p>
                  {item.score != null && (
                    <p className="mt-2 font-display text-3xl font-semibold text-primary">
                      {item.score.toFixed(1)}
                      <span className="ml-1 text-xs font-sans font-normal text-muted-foreground">/ 10 our score</span>
                    </p>
                  )}
                  {item.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>}
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------ 04 Best picks */}
      {roundup && picks.length > 0 && (
        <section aria-labelledby="picks-title" className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
            <Reveal>
              <SectionHeading index="04" title="Best picks, no hedging" href={articlePath(roundup.type, roundup.slug)} linkLabel="See the full roundup" id="picks-title" />
            </Reveal>
            <Reveal>
              <ol className="mt-8 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
                {picks.map(
                  (pick) =>
                    pick.type === "pick" && (
                      <li key={pick.rank}>
                        <Link
                          href={articlePath(roundup.type, roundup.slug)}
                          className="group flex flex-col gap-2 px-5 py-5 transition-colors hover:bg-accent/50 sm:flex-row sm:items-baseline sm:gap-6"
                        >
                          <span className="section-index w-10 shrink-0 text-vermilion" aria-hidden="true">
                            {String(pick.rank).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 sm:w-64 sm:shrink-0">
                            <span className="block font-display text-lg font-semibold leading-snug group-hover:underline underline-offset-4">
                              {pick.name}
                            </span>
                            {pick.badge && <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pick.badge}</span>}
                          </span>
                          <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{pick.blurb}</span>
                        </Link>
                      </li>
                    )
                )}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ 05 Deals desk */}
      {deals.length > 0 && (
        <section aria-labelledby="deals-title" className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <Reveal>
            <SectionHeading index="05" title="From the deals desk" href="/deals" linkLabel="All deals" id="deals-title" />
          </Reveal>
          <Reveal>
            <ol className="mt-8 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
              {deals.map((offer) => (
                <li
                  key={offer.id}
                  className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow text-muted-foreground">{offer.merchant.name}</p>
                    <p className="mt-0.5 font-display text-base font-semibold leading-snug">
                      {offer.label}
                      {offer.badge && (
                        <span className="ml-2 inline-block translate-y-[-1px] rounded-sm bg-sun/45 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
                          {offer.badge}
                        </span>
                      )}
                    </p>
                    {offer.dealText && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{offer.dealText}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 sm:shrink-0">
                    {offer.price && (
                      <p className="tabular-nums">
                        <span className="font-display text-lg font-semibold text-primary">{offer.price}</span>
                        <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {offer.currency}
                        </span>
                      </p>
                    )}
                    <AffiliateButton offerId={offer.id} size="sm">
                      View deal
                    </AffiliateButton>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Buy links are affiliate links — they never change the price you pay or a verdict on this site.{" "}
            <Link href="/affiliate-disclosure" className="underline underline-offset-2 hover:text-foreground">
              How deals make the list.
            </Link>
          </p>
        </section>
      )}

      {/* ------------------------------------------------ 06 Guides */}
      {guides.length > 0 && (
        <section aria-labelledby="guides-title" className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <Reveal>
            <SectionHeading index="06" title="Guides worth your evening" href="/guides" linkLabel="All guides" id="guides-title" />
          </Reveal>
          {guides.length === 1 ? (
            /* Single guide: feature layout with a side panel instead of a half-empty grid. */
            <div className="mt-8 grid gap-6 lg:grid-cols-12">
              <Reveal className="lg:col-span-8">
                <FeatureCard article={guides[0]} priority={false} />
              </Reveal>
              <Reveal className="lg:col-span-4">
                <div className="flex h-full flex-col justify-between rounded-md border border-border bg-muted/30 p-6">
                  <div>
                    <p className="eyebrow text-vermilion">Why guides</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Reviews tell you what we think. Guides teach you how to think — the
                      questions, the maths and the red flags to check in any category,
                      regardless of brand.
                    </p>
                  </div>
                  <Link
                    href="/guides"
                    className="group mt-6 inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-foreground"
                  >
                    Browse all guides
                    <ArrowRight className="h-4 w-4 text-vermilion transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {guides.map((guide, i) => (
                <Reveal key={guide.id}>
                  <ArticleCard article={guide} priority={i === 0} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------ Methodology band */}
      <section aria-labelledby="method-title" className="bg-ink text-[oklch(0.93_0.012_82)]">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow text-sun">The method</p>
              <h2 id="method-title" className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                How we earn the byline<span className="text-sun">.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[oklch(0.93_0.012_82)]/70">
                Every verdict on Duyan Blog is built the same way: a published methodology,
                named authors, visible trade-offs, and corrections that stay up. The hat is
                simple. So are our rules.
              </p>
              <Button asChild variant="secondary" className="mt-6 font-medium">
                <Link href="/methodology">Read the methodology</Link>
              </Button>
            </Reveal>
            <div className="grid gap-px overflow-hidden rounded-md bg-[oklch(0.93_0.012_82)]/15 sm:grid-cols-3 lg:col-span-7">
              {[
                { n: "01", t: "Evidence over hype", d: "Claims link to sources. Where we lack data, we say so instead of inventing numbers." },
                { n: "02", t: "Trade-offs in the open", d: "No product is perfect for everyone. We tell you who should buy it — and who shouldn't." },
                { n: "03", t: "Commerce never edits", d: "Affiliate revenue funds the site; it never decides a verdict. Rankings can't be bought." },
              ].map((p) => (
                <div key={p.n} className="bg-ink p-6">
                  <span className="section-index text-sun">{p.n}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{p.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[oklch(0.93_0.012_82)]/65">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Newsletter */}
      <section id="newsletter" aria-labelledby="nl-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 lg:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-md border border-border bg-card p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-border" aria-hidden="true">
              <div className="absolute inset-6 rounded-full border border-border" />
              <div className="absolute inset-12 rounded-full bg-sun/20" />
            </div>
            <div className="relative max-w-xl">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-6 w-6 text-foreground" />
                <p className="eyebrow text-muted-foreground">The monthly issue</p>
              </div>
              <h2 id="nl-title" className="mt-3 font-display text-3xl font-semibold tracking-tight">
                One email a month. Verdicts included<span className="text-vermilion">.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                New reviews, methodology notes and the occasional correction — written by
                the people who did the testing. No hype, no &quot;amazing deals&quot; spam.
              </p>
              <div className="mt-6">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
