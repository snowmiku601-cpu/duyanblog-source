import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { articlePath, articleTypeLabels } from "@/lib/site";
import type { ArticleCardData } from "@/lib/queries";

/**
 * End-of-article navigation: previous/next story within the same section type.
 * Pure server component — no client JS. Both slots collapse to a muted note
 * when there is no neighbour (single-story sections).
 */
export function PrevNext({
  type,
  newer,
  older,
}: {
  type: string;
  newer: ArticleCardData | null;
  older: ArticleCardData | null;
}) {
  if (!newer && !older) return null;

  const slot = (
    article: ArticleCardData | null,
    direction: "newer" | "older"
  ) => {
    if (!article) {
      return (
        <div className="flex min-h-24 flex-col justify-center bg-card/50 px-5 py-5">
          <p className="eyebrow text-muted-foreground/60">
            {direction === "newer" ? "Newer story" : "Earlier story"}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground/60">
            {direction === "newer" ? "You are reading the newest one." : "You have reached the oldest one."}
          </p>
        </div>
      );
    }
    return (
      <Link
        href={articlePath(article.type, article.slug)}
        className="group flex min-h-24 flex-col justify-center bg-card px-5 py-5 transition-colors hover:bg-accent/50"
      >
        <p className="eyebrow flex items-center gap-1.5 text-muted-foreground">
          {direction === "newer" ? (
            <>
              <ArrowLeft className="h-3.5 w-3.5 text-vermilion transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              Newer {articleTypeLabels[type as keyof typeof articleTypeLabels]?.toLowerCase() ?? "story"}
            </>
          ) : (
            <>
              <ArrowRight className="h-3.5 w-3.5 text-vermilion transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              Earlier {articleTypeLabels[type as keyof typeof articleTypeLabels]?.toLowerCase() ?? "story"}
            </>
          )}
        </p>
        <p className="mt-1.5 font-display text-base font-semibold leading-snug decoration-sun group-hover:underline underline-offset-4">
          {article.title}
        </p>
      </Link>
    );
  };

  return (
    <nav aria-label={`More ${articleTypeLabels[type as keyof typeof articleTypeLabels] ?? "stories"}`} className="border-t border-border print:hidden">
      <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
        {/* Reading order: earlier on the left, newer on the right. */}
        {slot(older, "older")}
        {slot(newer, "newer")}
      </div>
    </nav>
  );
}
