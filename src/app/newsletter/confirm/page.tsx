import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, MailX, MousePointerClick } from "lucide-react";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Confirm your subscription — Duyan Blog",
  description: "One click to confirm your newsletter subscription.",
  robots: { index: false, follow: false },
};

// Acts on searchParams and writes to the DB — never cache.
export const dynamic = "force-dynamic";

type State =
  | { kind: "done"; email: string }
  | { kind: "already"; email: string }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "missing" };

async function resolveState(token: string | undefined): Promise<State> {
  const t = token?.trim() ?? "";
  if (t === "") return { kind: "missing" };

  const sub = await db.newsletterSubscriber.findUnique({
    where: { confirmToken: t },
    select: { id: true, email: true, confirmed: true, confirmExpiresAt: true },
  });
  if (!sub) return { kind: "invalid" };

  if (sub.confirmed) return { kind: "already", email: sub.email };

  if (!sub.confirmExpiresAt || sub.confirmExpiresAt.getTime() < Date.now()) {
    return { kind: "expired" };
  }

  // The one write this page exists for — flip to confirmed and burn the token
  // so the link can't be replayed.
  await db.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { confirmed: true, confirmToken: null, confirmExpiresAt: null },
  });
  return { kind: "done", email: sub.email };
}

const HEADINGS: Record<State["kind"], string> = {
  done: "You're in.",
  already: "Already confirmed.",
  expired: "This link expired.",
  invalid: "This link doesn't check out.",
  missing: "Nothing to confirm.",
};

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await resolveState(token);

  return (
    <main className="relative overflow-hidden">
      {/* Sun motif — echoes the category/tag hubs */}
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-border"
        aria-hidden="true"
      >
        <div className="absolute inset-8 rounded-full bg-sun/20" />
        <div className="absolute inset-24 rounded-full bg-sun/10" />
      </div>

      <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-16 lg:px-6">
        <p className="eyebrow text-vermilion">The Duyan dispatch</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {HEADINGS[state.kind]}
        </h1>

        <div className="mt-6 max-w-xl">
          {state.kind === "done" && (
            <p className="text-lg leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">{state.email}</strong> is confirmed
              and on the list. The next issue lands in your inbox — reviews, comparisons and the
              occasional deal worth your attention.
            </p>
          )}
          {state.kind === "already" && (
            <p className="text-lg leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">{state.email}</strong> was already
              confirmed — nothing left to do. If you ever want out, the one-click unsubscribe link
              is at the bottom of every issue.
            </p>
          )}
          {state.kind === "expired" && (
            <p className="text-lg leading-relaxed text-muted-foreground">
              Confirmation links stay valid for 48 hours — this one has passed. Enter your email
              in the signup form again and a fresh link is issued straight away.
            </p>
          )}
          {state.kind === "invalid" && (
            <p className="text-lg leading-relaxed text-muted-foreground">
              We couldn&apos;t match that link to a pending subscription — it may have been used
              already, or the address was removed. Try signing up again; no harm done.
            </p>
          )}
          {state.kind === "missing" && (
            <p className="text-lg leading-relaxed text-muted-foreground">
              This page needs the confirmation link from your signup email — it looks like
              <code className="mx-1.5 rounded-sm bg-muted px-1.5 py-0.5 text-sm">?token=…</code>
              got lost somewhere along the way.
            </p>
          )}
        </div>

        <ul className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground">
          {state.kind === "done" && (
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Subscription recorded — first dispatch is compiled monthly.
            </li>
          )}
          {(state.kind === "expired" || state.kind === "invalid" || state.kind === "missing") && (
            <li className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
              Re-submitting the same email is safe — it just refreshes the link.
            </li>
          )}
          {state.kind === "expired" && (
            <li className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
              Links expire after 48 hours to keep the list clean.
            </li>
          )}
          {(state.kind === "invalid" || state.kind === "missing") && (
            <li className="flex items-center gap-2">
              <MailX className="h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
              Still stuck? The{" "}
              <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
                contact form
              </Link>{" "}
              reaches a human.
            </li>
          )}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to the front page
          </Link>
          <Link
            href="/reviews"
            className="inline-flex h-11 items-center rounded-sm border border-border px-5 text-sm font-medium transition-colors hover:border-vermilion/60 hover:text-vermilion focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read the latest reviews
          </Link>
        </div>

        <p className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          Double opt-in keeps this list honest — nobody is subscribed without clicking the link
          themselves. See the{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
            privacy policy
          </Link>{" "}
          for what we store ({site.name} keeps your email and nothing else).
        </p>
      </div>
    </main>
  );
}
