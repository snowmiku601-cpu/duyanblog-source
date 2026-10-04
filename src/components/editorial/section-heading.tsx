import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Numbered editorial section heading: "01 — Latest reviews ……… View all →" */
export function SectionHeading({
  index,
  title,
  href,
  linkLabel,
  className,
  id,
}: {
  index?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  /** Applied to the h2 so a section's aria-labelledby resolves to it. */
  id?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 border-b border-border pb-3", className)}>
      <h2 id={id} className="flex items-baseline gap-3">
        {index && (
          <span className="section-index text-vermilion">{index}</span>
        )}
        <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          {title}
        </span>
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {linkLabel ?? "View all"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
