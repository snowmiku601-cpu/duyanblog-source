import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { articlePath, articleTypeLabels, type ArticleType } from "@/lib/site";
import type { ArticleCardData } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Highlight } from "@/components/editorial/highlight";

function Meta({ article, className }: { article: ArticleCardData; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground", className)}>
      <span className="font-medium text-foreground/80">{article.authorName}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={(article.publishedAt ?? article.updatedAt).toISOString()}>
        {formatDate(article.publishedAt ?? article.updatedAt)}
      </time>
      {article.readingMinutes ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {article.readingMinutes} min
          </span>
        </>
      ) : null}
    </p>
  );
}

function CategoryTag({ article, className }: { article: ArticleCardData; className?: string }) {
  return (
    <p className={cn("eyebrow text-vermilion", className)}>
      {articleTypeLabels[article.type as ArticleType] ?? "Story"} · {article.categoryName}
    </p>
  );
}

/** Standard bordered card used in grids. */
export function ArticleCard({ article, priority = false }: { article: ArticleCardData; priority?: boolean }) {
  const href = articlePath(article.type, article.slug);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_-18px_oklch(0.25_0.02_55/0.35)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {article.heroImage ? (
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-secondary/30">
            <span className="font-display text-4xl text-secondary-foreground/50">{article.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <CategoryTag article={article} />
        <h3 className="font-display text-lg font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.deck}</p>
        <Meta article={article} className="mt-auto pt-2" />
      </div>
    </article>
  );
}

/** Large asymmetric feature card. */
export function FeatureCard({ article, priority = false }: { article: ArticleCardData; priority?: boolean }) {
  const href = articlePath(article.type, article.slug);
  return (
    <article className="group grid overflow-hidden rounded-md border border-border bg-card md:grid-cols-2">
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-72 bg-muted">
        {article.heroImage ? (
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-secondary/30">
            <span className="font-display text-5xl text-secondary-foreground/50">{article.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 lg:p-8">
        <CategoryTag article={article} />
        <h3 className="font-display text-2xl lg:text-[1.75rem] font-semibold leading-tight">
          <Link href={href} className="relative after:absolute after:inset-0 after:content-['']">
            {article.title}
          </Link>
        </h3>
        <p className="text-sm lg:text-base leading-relaxed text-muted-foreground">{article.deck}</p>
        <Meta article={article} className="pt-1" />
      </div>
    </article>
  );
}

/** Compact numbered row — "the wire" style list item. */
export function ArticleRow({
  article,
  index,
  highlight,
}: {
  article: ArticleCardData;
  index: number;
  /** Optional search query — matching words in the title get <mark>ed. */
  highlight?: string;
}) {
  const href = articlePath(article.type, article.slug);
  return (
    <li className="group border-b border-border last:border-b-0">
      <Link href={href} className="flex items-baseline gap-4 py-3.5 transition-colors">
        <span className="section-index w-7 shrink-0 text-muted-foreground/70 group-hover:text-vermilion" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <span className="flex-1">
          <span className="block font-display text-base font-medium leading-snug group-hover:underline underline-offset-4 decoration-sun">
            {highlight ? <Highlight text={article.title} needle={highlight} /> : article.title}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {articleTypeLabels[article.type as ArticleType] ?? "Story"} · {article.categoryName} ·{" "}
            <time dateTime={(article.publishedAt ?? article.updatedAt).toISOString()}>
              {formatDate(article.publishedAt ?? article.updatedAt)}
            </time>
          </span>
        </span>
      </Link>
    </li>
  );
}
