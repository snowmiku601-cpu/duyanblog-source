"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Back-to-top control for long article pages. Appears after the first
 * viewport of scrolling; respects prefers-reduced-motion.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    function update() {
      setVisible(window.scrollY > 720);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary focus-visible:-translate-y-0.5 print:hidden"
    >
      <ArrowUp className="h-4.5 w-4.5" aria-hidden="true" />
    </button>
  );
}
