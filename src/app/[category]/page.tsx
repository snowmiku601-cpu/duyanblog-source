import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Rss } from "lucide-react";
import { SectionHeading } from "@/components/editorial/section-heading";
import { ArticleCard } from "@/components/editorial/article-card";
import { FeatureCard } from "@/components/editorial/article-card";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";
import { getArticlesByCategory, getCategoryBySlug, getCategories } from "@/lib/queries";
import { articlePath } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildMetadata({
    title: `${category.name} — ${category.tagline}`,
    description: category.description,
    path: `/${category.slug}`,
    rss: `/feed.xml?category=${encodeURIComponent(category.slug)}`,
    jsonFeed: `/feed.json?category=${encodeURIComponent(category.slug)}`,
  });
}

export default async function CategoryHub({ params }: Params) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [articles, categories] = await Promise.all([
    getArticlesByCategory(category.id, 30),
    getCategories(),
  ]);
  const [featured, ...rest] = articles;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: category.name, href: `/${category.slug}` },
          ]),
          ...(articles.length > 0
            ? [
                itemListJsonLd(
                  category.name,
                  articles.map((a) => ({ name: a.title, url: articlePath(a.type, a.slug) }))
                ),
              ]
            : []),
        ]}
      />

      {/* Hub hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sun/20" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full border border-border" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-20">
          <p className="section-index text-vermilion">Section · {category.slug}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
            {category.name}<span className="text-vermilion">.</span>
          </h1>
          <p className="mt-3 font-display text-xl text-muted-foreground">{category.tagline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{category.description}</p>
          <a
            href={`/feed.xml?category=${encodeURIComponent(category.slug)}`}
            className="group mt-6 inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-vermilion/50 hover:text-foreground"
            aria-label={`Subscribe to the ${category.name} RSS feed`}
          >
            <Rss className="h-3.5 w-3.5 text-vermilion" aria-hidden="true" />
            Subscribe to this section
            <span className="sr-only"> via RSS</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        {articles.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
            No stories in this section yet — the sample issue includes some. Run{" "}
            <code className="rounded-sm bg-muted px-1.5 py-0.5">npm run seed:demo</code>.
          </p>
        ) : (
          <div className="space-y-12">
            <Reveal>
              <SectionHeading index="01" title="Start here" />
              <div className="mt-8">
                <FeatureCard article={featured} priority />
              </div>
            </Reveal>

            {rest.length > 0 && (
              <Reveal>
                <SectionHeading index="02" title="Everything in this section" />
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((article) => (
                    <Reveal key={article.id}>
                      <ArticleCard article={article} />
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        )}

        {/* Cross-links to sibling sections */}
        <div className="mt-16 border-t border-border pt-8">
          <p className="eyebrow text-muted-foreground">Other sections</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories
              .filter((c) => c.slug !== category.slug)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/${c.slug}`}
                  className="group inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  {c.name}
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}