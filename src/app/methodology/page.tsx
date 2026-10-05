import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { db } from "@/lib/db";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Methodology — how we review and score",
  description:
    "The Duyan Blog review methodology: how we build verdicts from published specs, named sources and dated checks — and what we do when the evidence is thin. No invented numbers, ever.",
  path: "/methodology",
});

const FALLBACK_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1 · We pick products people actually buy",
    body: [
      "Review subjects come from reader questions first, market share second, press releases last. Before anything is scheduled we write down the decision a reader is trying to make — “which eSIM for two weeks in Japan” — because that decision, not the product spec sheet, is what the review must settle.",
    ],
  },
  {
    title: "2 · Two names on every review",
    body: [
      "Every review has a named author who does the research-and-reasoning and a second editor who verifies the claims against the cited sources. Both names appear on the page. If we can't put two names behind a piece, it doesn't run as a review.",
    ],
  },
  {
    title: "3 · Evidence-first: sources and the day we checked",
    body: [
      "We read the vendor's published pages and the documentation, and we record — for every figure — the URL it came from and the day a human opened it, in the source list at the foot of the page. Where an independent group has measured something, we cite their published result by name.",
      "We do not run our own benchmarks; no page here carries one, and if that ever changes the page will say so. Where a vendor publishes nothing on a point, we leave it empty rather than fill it — a missing row means we did not find it, not that the feature is absent.",
    ],
  },
  {
    title: "4 · Scores map to published criteria",
    body: [
      "Reviews score a small set of criteria with explicit weights — for software, typically: core experience, performance, value, support and privacy. The overall number is a weighted average of those rows, shown on the page, so you can recompute it or disagree with the weights.",
      "A score without visible criteria is decoration, not review.",
    ],
  },
  {
    title: "5 · Evidence or honesty — never invented numbers",
    body: [
      "Claims link to sources. When we haven't verified something, we say so plainly instead of producing a plausible-looking statistic. Sample and demo content is labelled as such, everywhere it appears.",
      "We never fabricate research hours, units tested, expert credentials or awards.",
    ],
  },
  {
    title: "6 · Commerce never edits",
    body: [
      "Merchants and affiliate networks cannot influence scores, rankings or wording. We track this with a simple rule: verdicts are finalised before commission rates are even looked at, and any attempt to change them is published as a correction.",
      "Read the business side in How we make money, and the link rules in the Affiliate disclosure.",
    ],
  },
  {
    title: "7 · Living documents, dated changes",
    body: [
      "Reviews are revisited when prices, features or our recommendations change. Updated articles carry a new “updated” date and keep their original reporting honest — changes that alter a verdict are noted, not silently smoothed over.",
    ],
  },
];

export default async function MethodologyPage() {
  const entries = await db.methodologyEntry.findMany({ orderBy: { updatedAt: "asc" } });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:px-6 lg:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Methodology", href: "/methodology" },
        ])}
      />
      <p className="eyebrow text-vermilion">The method</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        How we review<span className="text-vermilion">.</span>
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Our methodology is the product. These are the rules every review, roundup and
        comparison on Duyan Blog is built on — published so you can check the working or
        argue with it.
      </p>

      <div className="prose-measure mt-10 space-y-10">
        {FALLBACK_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="prose-body mt-3 text-foreground/90">
                {p}
              </p>
            ))}
          </section>
        ))}

        {entries.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-semibold">Category playbooks</h2>
            <ul className="mt-4 space-y-3">
              {entries.map((e) => (
                <li key={e.id}>
                  <Link href={`/methodology/${e.slug}`} className="font-medium underline-offset-4 hover:underline">
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-12 rounded-md border border-border bg-muted/40 p-6">
        <p className="font-display text-lg font-semibold">Found a hole in the method?</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Good — that&apos;s what it&apos;s published for. Write to us via the{" "}
          <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">contact form</Link>{" "}
          and we&apos;ll answer publicly if it changes the rules.
        </p>
      </div>
    </article>
  );
}
