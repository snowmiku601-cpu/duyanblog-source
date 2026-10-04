"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          subject: String(data.get("subject") ?? ""),
          message: String(data.get("message") ?? ""),
          company: String(data.get("company") ?? ""),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setState("done");
        setMessage("Thanks — your message is in the editor inbox. We reply to everything that isn't spam.");
        form.reset();
      } else {
        setState("error");
        setMessage(json.error ?? "Something went wrong. Try again in a moment.");
      }
    } catch {
      setState("error");
      setMessage("Network hiccup — try again in a moment.");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-md border border-border bg-secondary/25 px-5 py-4 text-sm" role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required maxLength={80} autoComplete="name" className="bg-card" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" name="email" type="email" required maxLength={160} autoComplete="email" className="bg-card" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" required maxLength={140} className="bg-card" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" required maxLength={4000} rows={6} className="bg-card" />
      </div>
      <Button type="submit" disabled={state === "sending"} className="font-medium">
        {state === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" /> Send message
          </>
        )}
      </Button>
      <p aria-live="polite" role="status" className={state === "error" ? "text-sm text-vermilion" : "sr-only"}>
        {state === "error" ? message : ""}
      </p>
    </form>
  );
}
