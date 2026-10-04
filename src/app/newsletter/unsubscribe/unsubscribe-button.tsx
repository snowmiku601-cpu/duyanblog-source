"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/admin-client";

/**
 * Confirms the one-click unsubscribe. On success the row is deleted and the
 * card flips to a done state — no second email round-trip.
 */
export function UnsubscribeButton({ token, email }: { token: string; email: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function unsubscribe() {
    if (state === "busy" || state === "done") return;
    setState("busy");
    setError(null);
    const res = await api("/api/newsletter/unsubscribe", "POST", { token });
    if (res.ok) {
      setState("done");
    } else {
      setState("error");
      setError(res.error);
    }
  }

  if (state === "done") {
    return (
      <div className="mt-6" aria-live="polite">
        <p className="flex items-center justify-center gap-2 rounded-sm border border-primary/40 bg-accent/50 px-4 py-3 text-sm font-medium text-foreground">
          <PartyPopper className="h-4 w-4 text-primary" aria-hidden="true" />
          {email} is off the list.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Changed your mind?{" "}
          <Link href="/#newsletter" className="underline underline-offset-2 hover:text-foreground">
            Subscribing again takes one click.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button onClick={() => void unsubscribe()} disabled={state === "busy"} className="w-full font-medium">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
      {state === "error" && (
        <p role="alert" className="mt-3 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
