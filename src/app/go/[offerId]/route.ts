import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Affiliate click router: /go/[offerId]?src=[articleSlug]
 *
 * - Navigation NEVER depends on consent: this is a plain 302.
 * - We log an anonymous click (no IP, no raw identifiers) alongside the
 *   consent snapshot so reporting can separate consented vs unconsented.
 * - No deceptive redirects: the destination is the offer's declared URL.
 * - Unknown/inactive offers fall back to /deals instead of erroring.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const url = new URL(request.url);
  const src = url.searchParams.get("src")?.slice(0, 200) ?? null;

  const offer = await db.affiliateOffer.findFirst({
    where: { id: offerId, active: true },
    select: { id: true, url: true, articleId: true },
  });

  if (!offer) {
    // Relative redirect: `request.url` can carry the proxy's upstream origin
    // (e.g. 0.0.0.0:3000) behind a reverse proxy or hosting edge — building an
    // absolute URL from it would send visitors to a dead origin. A relative
    // Location is resolved by the browser against the public origin.
    return NextResponse.redirect("/deals", { status: 302 });
  }

  // Consent snapshot: the banner stores choices in localStorage (not a server
  // cookie), so the server cannot read analytics consent directly. We accept
  // an explicit, non-identifying `c=1|0` hint that the client MAY append —
  // navigation works identically without it.
  const consentHint = url.searchParams.get("c") === "1";

  try {
    await db.affiliateClick.create({
      data: {
        offerId: offer.id,
        articleId: offer.articleId,
        referer: src ?? request.headers.get("referer")?.slice(0, 500) ?? null,
        consentAnalytics: consentHint,
      },
    });
  } catch (err) {
    // Never let logging break navigation.
    console.error("affiliate click log failed", err);
  }

  return NextResponse.redirect(offer.url, { status: 302 });
}
