import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs, type Crumb } from "@/components/editorial/breadcrumbs";
import { ShareButton } from "@/components/editorial/share-button";
import { articlePath, articleTypeLabels, type ArticleType } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ArticleHeaderData = {
  slug: string;
  type: string;
  title: string;
  deck: string;
  heroImage: string | null;
  heroAlt: string | null;
  heroCredit: string | null;
  readingMinutes: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
  lastReviewedAt: Date | null;
  category: { slug: string; name: string };
  author: { slug: string; name: string; role: string; avatarUrl: string | null };
  reviewer: { slug: string; name: string; role: string } | null;
};

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return url ? (
    <Image src={url} alt="" width={40} height={40} className="h-10 w-10 rounded-full border border-border object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
    >
      {initials}
    </span>
  );
}

/**
 * Shared article header: breadcrumbs → eyebrow → headline → deck → byline
 * with published / updated / last-reviewed dates (trust metadata for reviews).
 */
export function ArticleHeader({ article, className }: { article: ArticleHeaderData; className?: string }) {
  const typeLabel = articleTypeLabels[article.type as ArticleType] ?? "Story";
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: typeLabel, href: articlePath(article.type, "_").replace(/\/_$/, "") },
    { label: article.title },
  ];

  return (
    <header className={cn("border-b border-border bg-muted/30", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
        <Breadcrumbs items={crumbs} className="mb-6" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="eyebrow text-vermilion">
              {typeLabel} · <Link href={`/${article.category.slug}`} className="hover:underline underline-offset-4">{article.category.name}</Link>
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{article.deck}</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <span className="flex items-center gap-2.5">
            <Avatar name={article.author.name} url={article.author.avatarUrl} />
            <span>
              <Link href={`/authors/${article.author.slug}`} className="font-medium hover:underline underline-offset-4">
                {article.author.name}
              </Link>
              <span className="block text-xs text-muted-foreground">{article.author.role}</span>
            </span>
          </span>
          {article.reviewer && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-8 w-px bg-border" aria-hidden="true" />
              Reviewed by{" "}
              <Link href={`/authors/${article.reviewer.slug}`} className="font-medium text-foreground hover:underline underline-offset-4">
                {article.reviewer.name}
              </Link>
            </span>
          )}
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {article.publishedAt && (
              <div className="flex gap-1.5">
                <dt className="sr-only">Published</dt>
                <dd>
                  Published <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
                </dd>
              </div>
            )}
            <div className="flex gap-1.5">
              <dt className="sr-only">Updated</dt>
              <dd>
                · Updated <time dateTime={article.updatedAt.toISOString()}>{formatDate(article.updatedAt)}</time>
              </dd>
            </div>
            {article.lastReviewedAt && (
              <div className="flex gap-1.5">
                <dt className="sr-only">Last reviewed</dt>
                <dd>
                  · Fact-checked <time dateTime={article.lastReviewedAt.toISOString()}>{formatDate(article.lastReviewedAt)}</time>
                </dd>
              </div>
            )}
            {article.readingMinutes && <dd>· {article.readingMinutes} min read</dd>}
          </dl>
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <ShareButton title={article.title} className="sm:ml-auto" />
        </div>
      </div>
    </header>
  );
}
