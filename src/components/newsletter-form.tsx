"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MailCheck } from "lucide-react";

/**
 * Newsletter signup — posts to /api/newsletter. Includes a honeypot field;
 * the endpoint is rate-limited. No consent-gated tracking involved.
 */
export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    setConfirmUrl(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: hp }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        alreadyConfirmed?: boolean;
        confirmUrl?: string;
      };
      if (res.ok && data.ok) {
        setState("done");
        setConfirmUrl(data.confirmUrl ?? null);
        setMessage(
          data.alreadyConfirmed
            ? "You're already on the list — nothing else to do."
            : "Almost there — check your inbox and click the confirmation link."
        );
      } else {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Try again in a moment.");
      }
    } catch {
      setState("error");
      setMessage("Network hiccup — try again in a moment.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-sm" role="status">
          <MailCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {message}
        </p>
        {/* Non-production only: the API hands back the confirm URL when there is
            no SMTP infrastructure to email it. Never rendered in production. */}
        {confirmUrl && (
          <a
            href={confirmUrl}
            className="w-fit px-4 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Dev shortcut: open the confirmation link
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-2" : "space-y-2.5"} noValidate={false}>
      {/* Honeypot — hidden from humans, catches bots */}
      <input
        type="text"
        name="company"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={compact ? "nl-email-c" : "nl-email"} className="sr-only">
          Email address
        </label>
        <Input
          id={compact ? "nl-email-c" : "nl-email"}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 max-w-sm bg-card"
          autoComplete="email"
        />
        <Button type="submit" disabled={state === "sending"} className="h-11 font-medium">
          {state === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Joining…
            </>
          ) : (
            "Join the issue"
          )}
        </Button>
      </div>
      <p aria-live="polite" className={state === "error" ? "text-sm text-vermilion" : "sr-only"} role="status">
        {state === "error" ? message : ""}
      </p>
    </form>
  );
}
