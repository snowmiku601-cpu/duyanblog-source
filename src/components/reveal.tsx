"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle scroll reveal. Purely presentational, respects prefers-reduced-motion
 * via the .reveal CSS rules in globals.css.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.in = "1";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in", "1");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(el);
    // Robustness fallback: never leave content hidden if the observer
    // never fires (print, headless capture, exotic embeds).
    const fallback = window.setTimeout(() => el.setAttribute("data-in", "1"), 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    // @ts-expect-error — polymorphic ref assignment
    <Tag ref={ref} data-in="0" className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
