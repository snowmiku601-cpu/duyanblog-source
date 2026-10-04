"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side error boundary — surfacing to console for the dev log.
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="mx-auto grid max-w-6xl flex-1 place-items-center px-4 py-24 lg:px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow text-vermilion">Something broke</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          The press jammed mid-page.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          An unexpected error stopped this page from rendering. Try again — if it keeps
          happening, the contact form reaches a human who fixes things.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset} className="font-medium">Try again</Button>
          <Button asChild variant="outline" className="font-medium">
            <a href="/">Front page</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
