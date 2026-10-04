"use client";

import { useEffect, useState } from "react";

/**
 * Thin fixed reading-progress bar for long-form article pages.
 * Solid primary colour (no gradients, per DESIGN.md), scaleX for cheap
 * repaints, hidden from assistive tech and print.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const value = total > 0 ? Math.min(1, Math.max(0, el.scrollTop / total)) : 0;
      setProgress(value);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] print:hidden">
      <div
        className="h-full w-full origin-left bg-primary"
        style={{ transform: `scaleX(${progress})`, opacity: progress > 0 ? 1 : 0 }}
      />
    </div>
  );
}
