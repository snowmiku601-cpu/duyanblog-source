import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { UnsubscribeButton } from "./unsubscribe-button";

export const metadata: Metadata = buildMetadata({
  title: "Unsubscribe",
  description: "One-click unsubscribe from the Duyan Blog monthly issue.",
  path: "/newsletter/unsubscribe",
  noIndex: true,
});

type PageProps = { searchParams: Promise<{ token?: string }> };

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe landing: the token in the URL is the proof (this is
 * the link a real monthly email would carry). Valid token → confirm card;
 * unknown/used token → honest dead end with a way back in.
 */
export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const clean = (token ?? "").trim().toLowerCase();

  const subscriber = /^[0-9a-f]{16,64}$/.test(clean)
    ? await db.newsletterSubscriber.findUnique({ where: { unsubscribeToken: clean }, select: { email: true } })
    : null;

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-6xl place-items-center px-4 py-20 lg:px-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-md border border-border bg-card p-8 text-center">
        {/* Sun ornament — same family as the newsletter sign-off card */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-border" aria-hidden="true">
          <div className="absolute inset-5 rounded-full border border-border" />
          <div className="absolute inset-10 rounded-full bg-sun/20" />
        </div>

        <div className="relative">
          <p className="eyebrow text-vermilion">The monthly issue</p>

          {!subscriber ? (
            <>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                This link has run its course<span className="text-vermilion">.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Unsubscribe links are single-purpose and stop working once used — or the
                address was never on the list. If you keep getting mail anyway, reply to
                any issue and a human will sort it.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex h-10 items-center rounded-sm border border-border px-4 text-sm font-medium transition-colors hover:bg-accent/60"
              >
                Back to the front page
              </Link>
            </>
          ) : (
            <>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                Leave the list<span className="text-vermilion">.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                This stops the monthly issue for{" "}
                <strong className="font-medium text-foreground">{subscriber.email}</strong> —
                reviews, methodology notes and everything else. No hard feelings; the door
                stays open.
              </p>
              <UnsubscribeButton token={clean} email={subscriber.email} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
