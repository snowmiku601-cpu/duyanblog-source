import type { Metadata } from "next";
import Link from "next/link";
import { MerchantOffer } from "@/components/affiliate/merchant-offer";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { offerToView } from "@/lib/offers";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { articlePath } from "@/lib/site";

export const revalidate = 120;

export const metadata: Metadata = buildMetadata({
  title: "Deals worth your money",
  // Truthful in both modes: no "checked/reviewed" claim that fictional demo data
  // would contradict — sample labelling is rendered on the page itself.
  description:
    "Current deals on products and services we cover. Offers are labelled clearly when they are samples, and prices can change — check the merchant page.",
  path: "/deals",
});

export default async function DealsPage() {
  const [settings, offers] = await Promise.all([
    getSiteSettings(),
    db.affiliateOffer.findMany({
      where: { active: true, isDeal: true },
      include: { merchant: true, article: { select: { slug: true, type: true, title: true, isDemo: true } } },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
  ]);

  // Demo presentation truth for the whole page: the site-level demo_mode setting,
  // OR an offer attached to a demo article — either keeps the card labelled sample.
  const pageDemoMode = settings["demo_mode"] === "true";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Deals", href: "/deals" },
        ])}
      />
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
          <p className="eyebrow text-vermilion">Checked, not scraped</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Deals worth your money<span className="text-vermilion">.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {pageDemoMode
              ? "Sample offers on things we cover — the merchants and discounts here are fictional demo data."
              : "We only list deals on things we have reviewed or would stake our byline on."}{" "}
            Links are affiliate links —{" "}
            <Link href="/affiliate-disclosure" className="underline underline-offset-2 hover:text-foreground">
              here&apos;s what that means
            </Link>
            .
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        {offers.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
            No active deals right now.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div key={offer.id} className="flex flex-col">
                <MerchantOffer offer={offerToView(offer)} articleSlug={offer.article?.slug} isDemo={pageDemoMode || offer.article?.isDemo === true} className="flex-1" />
                {offer.article && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {offer.article.isDemo ? (
                      <>
                        Sample article:{" "}
                        <Link href={articlePath(offer.article.type, offer.article.slug)} className="underline underline-offset-2 hover:text-foreground">
                          view the demo review
                        </Link>
                      </>
                    ) : (
                      <>
                        We reviewed this:{" "}
                        <Link href={articlePath(offer.article.type, offer.article.slug)} className="underline underline-offset-2 hover:text-foreground">
                          read the review
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-10 text-xs text-muted-foreground">
          Deals can change without notice. Check the merchant page for current price and availability.
          {pageDemoMode && <> Merchants, offers and discounts on this page are fictional sample data.</>}
        </p>
      </div>
    </>
  );
}
