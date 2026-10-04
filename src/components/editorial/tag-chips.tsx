import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Editorial tag chips — hairline text links, deliberately NOT pills
 * (see DESIGN.md anti-slop rules). Used at the end of articles and on hubs.
 */
export function TagChips({
  tags,
  className,
}: {
  tags: { slug: string; name: string }[];
  className?: string;
}) {
  if (tags.length === 0) return null;
  return (
    <nav aria-label="Tags" className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <span className="eyebrow text-muted-foreground/70">Tagged</span>
      {tags.map((t) => (
        <Link
          key={t.slug}
          href={`/tag/${t.slug}`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <span className="text-vermilion" aria-hidden="true">
            #
          </span>{" "}
          {t.name}
        </Link>
      ))}
    </nav>
  );
}
