import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

/**
 * Affiliate click router: /go/[offerId]?src=[articleSlug]
 *
 * - Navigation NEVER depends on consent: this is a plain 302.
 * - We log a minimal anonymous click: offer, timestamp, and a controlled
 *   source path when the link carried one (article slug or /deals). We do not
 *   read or store the browser's Referer header (it can carry query strings /
 *   PII), and we never store an IP with click data.
 * - No deceptive redirects: the destination is the offer's declared URL.
 * - Unknown/inactive offers fall back to /deals instead of erroring.
 */
export const dynamic = "force-dynamic";

/** A controlled internal source path, never the raw Referer. */
function safeSource(src: string | null): string | null {
  if (!src) return null;
  // Only accept a path-shaped, whitelisted source: an article slug or /deals.
  const trimmed = src.trim();
  if (/^\/deals$/.test(trimmed)) return "/deals";
  if (/^[a-z0-9][a-z0-9-]{1,80}$/i.test(trimmed)) return `/${trimmed}`;
  return null;
}

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
    // Fallback to /deals on the PUBLIC origin: `request.url` can carry the
    // proxy's upstream origin (e.g. 0.0.0.0:3000) behind a reverse proxy or
    // hosting edge, and NextResponse.redirect rejects a bare relative path —
    // so build the absolute URL from the configured public site URL.
    return NextResponse.redirect(`${site.url}/deals`, { status: 302 });
  }

  try {
    await db.affiliateClick.create({
      data: {
        offerId: offer.id,
        articleId: offer.articleId,
        sourcePath: safeSource(src),
      },
    });
  } catch (err) {
    // Never let logging break navigation.
    console.error("affiliate click log failed", err);
  }

  return NextResponse.redirect(offer.url, { status: 302 });
}
