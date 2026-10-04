"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; text: string };

/**
 * Table-of-contents list with scrollspy: the section currently in view is
 * highlighted. Server pages extract headings from blocks and pass them in, so
 * the client bundle only ships this tiny observer — no content.
 *
 * Keep the markup in sync with the editorial design (numbered items, left
 * hairline rail, vermilion active state).
 */
export function TocNav({ items, title = "On this page" }: { items: TocItem[]; title?: string }) {
  // Start with the first section active; the observer corrects on first scroll.
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size > 0) {
          // The topmost heading inside the observation band wins.
          const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
          setActive((prev) => (prev === top ? prev : top));
        }
      },
      // A narrow band below the sticky header: a heading is "active" while it
      // sits in the top third of the viewport.
      { rootMargin: "-96px 0px -66% 0px", threshold: [0, 1] }
    );
    for (const h of headings) observer.observe(h);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="eyebrow text-muted-foreground">{title}</p>
      <ol className="mt-3 space-y-1 border-l border-border">
        {items.map((h, i) => {
          const isActive = h.id === active;
          return (
            <li key={h.id} className={cn("-ml-px border-l-2 pl-4 transition-colors", isActive ? "border-vermilion" : "border-transparent hover:border-ochre")}>
              <a
                href={`#${h.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block py-1.5 leading-snug transition-colors",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "mr-2 font-display font-semibold",
                    isActive ? "text-vermilion" : "text-vermilion/70"
                  )}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {h.text}
              </a>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 hidden text-[11px] leading-relaxed text-muted-foreground/70 lg:block">
        Scroll — the numbered section you are reading lights up.
      </p>
    </nav>
  );
}
