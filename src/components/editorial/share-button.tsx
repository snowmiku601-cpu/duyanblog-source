"use client";

import { useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Share control for article pages. Uses the Web Share API on supporting
 * devices (mobile share sheet); everywhere else it copies the canonical
 * URL to the clipboard with a toast confirmation. No third-party trackers.
 */
export function ShareButton({ title, className }: { title: string; className?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onShare() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return; // share sheet handled by the OS
      } catch (err) {
        // user dismissed the sheet — not an error worth surfacing
        if (err instanceof DOMException && err.name === "AbortError") return;
        // otherwise fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it anywhere you like." });
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2400);
    } catch {
      // clipboard may be blocked (permissions / http) — offer the URL directly
      toast({
        title: "Copy this link",
        description: url.replace(/^https?:\/\//, ""),
        variant: "destructive",
      });
    }
  }

  // Deterministic across SSR/hydration: Link2 by default, Check after copy.
  const Icon = copied ? Check : Link2;

  return (
    <button
      type="button"
      onClick={onShare}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring print:hidden",
        copied && "border-primary/50 text-primary",
        className,
      )}
      aria-label={copied ? "Link copied" : "Share this article"}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span aria-live="polite">{copied ? "Copied" : "Share"}</span>
    </button>
  );
}
